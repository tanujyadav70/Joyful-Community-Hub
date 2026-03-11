import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    const existing = await User.findOne({ username: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }
    const user = new User({ username: email.toLowerCase(), password, name });
    await user.save();
    if (req.session) {
      req.session.userId = user.id;
    }
    // create a blank profile for the user
    try {
      const { Profile } = await import("../models/Profile");
      await Profile.create({ userId: user.id });
    } catch (err) {
      console.error("Failed to create profile for new user", err);
    }
    res.status(201).json({ id: user.id, username: user.username, name: user.name });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    // check for special admin credentials first
    if (
      process.env.ADMIN_ID &&
      process.env.ADMIN_PASSWORD &&
      email === process.env.ADMIN_ID &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // ensure we have a corresponding user record so admin can use all normal
      // student features without extra conditionals throughout the code.
      let adminUser = await User.findOne({ username: email.toLowerCase() });
      if (!adminUser) {
        // create a lightweight admin user; the password will be hashed via the
        // pre-save hook on the User schema
        adminUser = new User({ username: email.toLowerCase(), password, name: "Administrator" });
        await adminUser.save();
      }
      if (req.session) {
        req.session.userId = adminUser.id;
        req.session.isAdmin = true;
      }
      return res.json({ id: adminUser.id, username: adminUser.username, name: adminUser.name, isAdmin: true });
    }
    const user = await User.findOne({ username: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (req.session) {
      req.session.userId = user.id;
    }
    // ensure any existing isAdmin flag is cleared when a normal user logs in
    if (req.session) {
      req.session.isAdmin = false;
    }
    res.json({ id: user.id, username: user.username, name: user.name });
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response) {
  if (req.session) {
    req.session.destroy(() => {});
  }
  res.json({ message: "Logged out" });
}

export async function me(req: Request, res: Response) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await User.findById(req.session.userId).select("username name");
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({ id: user.id, username: user.username, name: user.name, isAdmin: req.session.isAdmin || false });
}
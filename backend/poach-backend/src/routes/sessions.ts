// src/routes/sessions.ts
import express, { Request, Response } from 'express';
import { supabase } from '../supabaseClient';

const router = express.Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return; // Ensure no further code executes after response
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  res.status(200).json({
    access_token: data.session?.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
});

export default router;



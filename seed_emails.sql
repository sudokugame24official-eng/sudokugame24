INSERT INTO "EmailTemplate" (id, name, subject, "htmlContent", "createdAt", "updatedAt")
VALUES
('welcome_email_01', 'WELCOME_EMAIL', 'Bienvenue sur SudokuGame24 !', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2>Bienvenue {{username}} !</h2><p>Merci de vous être inscrit sur SudokuGame24.</p><p>Préparez-vous à affronter les meilleurs joueurs mondiaux et à grimper dans le classement.</p><p>À très vite sur la grille !</p></div>', NOW(), NOW()),
('email_verification_01', 'EMAIL_VERIFICATION', 'Vérifiez votre adresse email - SudokuGame24', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2>Vérification de votre compte</h2><p>Bonjour {{username}},</p><p>Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email et activer votre compte :</p><p><a href="{{verifyUrl}}" style="background-color: #00BFFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vérifier mon email</a></p><p>Si vous n''avez pas demandé cette inscription, ignorez simplement cet email.</p></div>', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  "htmlContent" = EXCLUDED."htmlContent",
  "updatedAt" = EXCLUDED."updatedAt";

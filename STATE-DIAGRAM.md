# SpendLens State Diagram (Simplified)

## Main Application States

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SPENDLENS APPLICATION                            │
└─────────────────────────────────────────────────────────────────────────┘

                                  START
                                    │
                                    ▼
                            ┌───────────────┐
                            │     GUEST     │
                            │ (Unauthenticated)│
                            └───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              [Login Click]                   [Signup Click]
                    │                               │
                    └───────────┬───────────────────┘
                                ▼
                        ┌───────────────┐
                        │AUTHENTICATING │
                        │  (Loading...)  │
                        └───────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              [Auth Failed]           [Auth Success]
                    │                       │
                    ▼                       ▼
            ┌───────────────┐       ┌─────────────┐
            │  LOGGED OUT   │       │ LOGGED IN   │
            │  (Show Error) │       │  (Has JWT)  │
            └───────────────┘       └─────────────┘
                    │                       │
                    │                       │
              [Try Again]                   │
                    │                       │
                    └───────────┬───────────┘
                                │
                        [Retry Auth]
                                │
                                ▼
                        ┌───────────────┐
                        │AUTHENTICATING │
                        └───────────────┘
```

---

## Authenticated User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          LOGGED IN STATE                                 │
└─────────────────────────────────────────────────────────────────────────┘

                            ┌─────────────┐
                            │  DASHBOARD  │ ◄──── [Default Route]
                            │   (Home)    │
                            └─────────────┘
                                    │
        ┌───────────────┬───────────┼───────────┬───────────┬──────────────┐
        │               │           │           │           │              │
        ▼               ▼           ▼           ▼           ▼              ▼
   ┌────────┐    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    ┌────────┐
   │ UPLOAD │    │STATEMENTS│ │TRANSAC│  │  RISKS │  │INSIGHTS│    │SETTINGS│
   │        │    │          │ │ TIONS │  │        │  │        │    │        │
   └────────┘    └────────┘  └────────┘  └────────┘  └────────┘    └────────┘
        │               │           │           │           │              │
        └───────────────┴───────────┴───────────┴───────────┴──────────────┘
                                    │
                               [Logout]
                                    │
                                    ▼
                            ┌─────────────┐
                            │   GUEST     │
                            └─────────────┘
```

---

## Upload Page State Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          UPLOAD PROCESS                                  │
└─────────────────────────────────────────────────────────────────────────┘

       ┌──────────────┐
       │   NO FILES   │  ◄──────────────────┐
       │   (Empty)    │                     │
       └──────────────┘                     │
              │                             │
       [Select Files]                       │
              │                             │
              ▼                             │
       ┌──────────────┐                     │
       │FILES SELECTED│                     │
       │  (Ready)     │                     │
       └──────────────┘                     │
              │                             │
       [Click Upload]                       │
              │                             │
              ▼                             │
       ┌──────────────┐                     │
       │  UPLOADING   │                     │
       │ (Progress %) │                     │
       └──────────────┘                     │
              │                             │
    [Upload Complete]                       │
              │                             │
              ▼                             │
       ┌──────────────┐                     │
       │  PROCESSING  │                     │
       │(AI Parsing)  │                     │
       └──────────────┘                     │
              │                             │
    ┌─────────┴─────────┐                  │
    │                   │                  │
[Success]          [Error]                 │
    │                   │                  │
    ▼                   ▼                  │
┌─────────┐      ┌──────────┐             │
│ SUCCESS │      │  ERROR   │             │
│(Show OK)│      │(Show Err)│             │
└─────────┘      └──────────┘             │
    │                   │                  │
    │                   └──────────────────┘
    │                   [Try Again]
    │
    └───────────────────┐
          [Upload More] │
                        │
                        ▼
                 ┌──────────────┐
                 │   NO FILES   │
                 └──────────────┘
```

---

## Risk Analysis State Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RISK ANALYSIS FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

       ┌──────────────────┐
       │LOADING PATTERNS  │
       │   (Fetching...)  │
       └──────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
[No Data]          [Has Data]
    │                   │
    ▼                   ▼
┌─────────────┐   ┌──────────────┐
│   EMPTY     │   │   VIEWING    │
│ (No Risks)  │   │   PATTERNS   │
└─────────────┘   └──────────────┘
    │                   │
    │                   ├─────[Edit]────────►┌──────────────┐
    │                   │                     │   EDITING    │
    │                   │                     │   PATTERN    │
    │                   │                     └──────────────┘
    │                   │                            │
    │                   │                      [Save]│
    │                   │                            │
    │                   │                            ▼
    │                   │                     ┌──────────────┐
    │                   ├─────[Feedback]────►│  PROVIDING   │
    │                   │                     │  FEEDBACK    │
    │                   │                     └──────────────┘
    │                   │                            │
    │                   │                      [Submit]
    │                   │                            │
    │                   │◄───────────────────────────┘
    │                   │
    │                   ├─────[Dismiss]─────►┌──────────────┐
    │                   │                     │  DISMISSING  │
    │                   │                     │   PATTERN    │
    │                   │                     └──────────────┘
    │                   │                            │
    │                   │◄──────[Confirm]────────────┘
    │                   │
    └───────┬───────────┘
            │
      [Analyze]
            │
            ▼
     ┌──────────────┐
     │  ANALYZING   │
     │ (AI Running) │
     └──────────────┘
            │
      [Complete]
            │
            ▼
     ┌──────────────┐
     │   VIEWING    │
     │   PATTERNS   │
     └──────────────┘
```

---

## Transaction Management Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       TRANSACTION MANAGEMENT                             │
└─────────────────────────────────────────────────────────────────────────┘

       ┌──────────────────┐
       │    LOADING       │
       │ (Fetching...)    │
       └──────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
[No Data]          [Has Data]
    │                   │
    ▼                   ▼
┌─────────────┐   ┌──────────────────┐
│   EMPTY     │   │     VIEWING      │
│(No Transactions) │ TRANSACTIONS  │
└─────────────┘   └──────────────────┘
    │                   │
    │                   ├─────[Search]────────►┌──────────────┐
    │                   │                       │  FILTERING   │
    │                   │                       │(Applying...)  │
    │                   │                       └──────────────┘
    │                   │                              │
    │                   │◄─────[Results]───────────────┘
    │                   │
    │                   ├─────[Edit]──────────►┌──────────────┐
    │                   │                       │   EDITING    │
    │                   │                       │ TRANSACTION  │
    │                   │                       └──────────────┘
    │                   │                              │
    │                   │◄─────[Save]──────────────────┘
    │                   │
    │                   ├─────[Enhance]───────►┌──────────────┐
    │                   │                       │  ENHANCING   │
    │                   │                       │  (AI Running)│
    │                   │                       └──────────────┘
    │                   │                              │
    │                   │◄─────[Complete]──────────────┘
    │                   │
    └───────────────────┘
```

---

## Settings Management Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SETTINGS MANAGEMENT                              │
└─────────────────────────────────────────────────────────────────────────┘

              ┌──────────────────┐
              │     VIEWING      │
              │    SETTINGS      │
              └──────────────────┘
                      │
      ┌───────────────┼───────────────┬──────────────────┐
      │               │               │                  │
[Edit Profile]  [Change Pwd]  [Edit Prefs]      [Delete Account]
      │               │               │                  │
      ▼               ▼               ▼                  ▼
┌────────────┐ ┌────────────┐ ┌────────────┐    ┌────────────┐
│  EDITING   │ │  CHANGING  │ │  EDITING   │    │  DELETING  │
│  PROFILE   │ │  PASSWORD  │ │PREFERENCES │    │  ACCOUNT   │
└────────────┘ └────────────┘ └────────────┘    └────────────┘
      │               │               │                  │
  [Save]          [Save]          [Save]          [Confirm]
      │               │               │                  │
      └───────────────┴───────────────┴──────────────────┘
                      │
                      ▼
              ┌──────────────────┐
              │     VIEWING      │
              │    SETTINGS      │
              └──────────────────┘
```

---

## State Symbols Legend

```
┌────────┐
│ STATE  │  = Active State
└────────┘

     │
     ▼      = Transition Direction

[Action]    = User Action or Event

(Detail)    = State Details

◄───        = Return/Back Transition

├───        = Branch Point
```

---

## Complete User Journey Map

```
1. FIRST TIME USER
   Guest → Signup → Authenticating → LoggedIn → Dashboard → Upload →
   Success → Transactions → RiskAnalysis → Analyzing → ViewingPatterns

2. RETURNING USER
   Guest → Login → Authenticating → LoggedIn → Dashboard →
   Statements → ViewingStatements → Transactions

3. RISK ANALYSIS
   LoggedIn → RiskAnalysis → Analyzing → ViewingPatterns →
   EditingPattern → ViewingPatterns → ProvidingFeedback → ViewingPatterns

4. MANAGE PROFILE
   LoggedIn → Settings → EditingProfile → ViewingSettings →
   ChangingPassword → ViewingSettings

5. ERROR RECOVERY
   Uploading → Error → NoFiles → SelectingFiles →
   FilesSelected → Uploading → Success

6. LOGOUT FLOW
   Any Page → Logout → LoggedOut → Guest
```

---

## State Duration Examples

| State | Typical Duration | Max Duration |
|-------|-----------------|--------------|
| Guest | Until user action | Indefinite |
| Authenticating | 1-2 seconds | 5 seconds |
| Uploading | 2-30 seconds | 5 minutes |
| Processing | 5-60 seconds | 10 minutes |
| Analyzing | 10-120 seconds | 5 minutes |
| EnhancingWithAI | 30-180 seconds | 10 minutes |
| EditingTransaction | Until user saves | Indefinite |
| ViewingPatterns | Until user action | Indefinite |

---

## Critical State Transitions

**Must Always Work:**
1. Guest → Authenticating (Login/Signup)
2. LoggedIn → Guest (Logout)
3. Any State → Error State (Error handling)
4. Error State → Previous State (Recovery)

**Must Be Fast:**
1. Authenticating → LoggedIn (< 2s)
2. Page Navigation (< 500ms)
3. Filtering Data (< 1s)

**Can Be Slow (Show Progress):**
1. Uploading → Processing (minutes)
2. Analyzing Risks (minutes)
3. Enhancing Transactions (minutes)

---

This simplified diagram provides a visual overview of the main state flows in SpendLens, making it easier to understand the application's behavior at a glance.

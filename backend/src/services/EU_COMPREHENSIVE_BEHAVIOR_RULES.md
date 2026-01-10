# Comprehensive European Transaction Behavior Detection Rules

## 🌍 Overview
Complete ruleset for detecting problematic spending patterns across European bank statements, covering 27 EU countries + UK, Switzerland, Norway.

---

## 🎰 GAMBLING & BETTING (Pan-European)

### Online Betting Platforms
**UK/Ireland:**
- Bet365, William Hill, Paddy Power, Ladbrokes, Coral, SkyBet
- Betfair, Betway, 888sport, Unibet
- In-play betting apps

**Continental Europe:**
- Bwin (Austria/Gibraltar)
- Betclic (France)
- Tipico (Germany/Malta)
- Sisal (Italy)
- OPAP (Greece)
- Svenska Spel (Sweden)
- Veikkaus (Finland)

**Crypto Gambling (Unregulated):**
- Stake.com, Rollbit, BC.Game
- Any .io domain casinos
- Blockchain betting platforms

### Sports Betting Red Flags
```
HIGH RISK INDICATORS:
- In-play betting (live match betting) = impulsive
- Multiple bookmakers (shopping for odds/chasing)
- Bet amounts increasing over time
- Betting outside own country sports (desperation)
- Weekend warrior pattern (Friday-Sunday heavy)
- Accumulator addiction (€5 bet on 10-fold)
- Cash-out patterns (never letting bets ride)
```

### Casino & Slots
**Physical Locations:**
- UK: Grosvenor, Hippodrome, Aspers
- France: Barrière, Partouche
- Monaco: Monte Carlo
- Germany: Spielbank
- Netherlands: Holland Casino

**Online Casinos:**
- LeoVegas, Casumo, Mr Green
- 888 Casino, PlayOJO
- Videoslots, Rizk

**Slot Machine Addiction (High Risk):**
```
PATTERN: Small frequent deposits (€10-20) multiple times per session
INDICATOR: Deposit-loss-deposit cycle within minutes
TIME: Late night (1am-5am) = problem gambling
ESCALATION: €20 → €50 → €100 → €500 deposits
```

### Lottery & Scratch Cards
**National Lotteries:**
- UK National Lottery, EuroMillions
- Irish Lotto
- France: La Française des Jeux
- Spain: Lotería Nacional
- Germany: Lotto
- Italy: SuperEnalotto

**Red Flags:**
```
LOW RISK: €10-20/month on lottery
MEDIUM RISK: >€100/month, multiple lottery systems
HIGH RISK: Daily purchases, scratch card addiction
CRITICAL: €500+/month, chasing big wins
```

### Betting Shops (Physical)
**UK High Street Bookies:**
- Ladbrokes, Coral, William Hill, Betfred
- FOBTs (Fixed Odds Betting Terminals) - highly addictive

```
DETECTION:
- Multiple daily visits to same bookmaker
- £50-100 withdrawals followed by betting shop
- Pattern: ATM → Bookies → ATM → Bookies
- Weekend binge patterns
```

### Cross-Border Gambling (Regulatory Evasion)
```
RED FLAG: Using offshore/unlicensed operators
INDICATORS:
- Payments to Curacao-licensed casinos
- VPN usage inferred (betting with foreign bookies)
- Cryptocurrency deposits to gambling sites
- Payment processor names: Zimpler, Trustly to unknown merchants
```

### Poker & Fantasy Sports
- PokerStars, partypoker, 888poker
- DraftKings, FanDuel (Daily Fantasy Sports)

```
PROFESSIONAL vs PROBLEM:
PROFESSIONAL: Consistent withdrawals, controlled deposits, tax records
PROBLEM: Deposit-only, escalating amounts, no withdrawals, late-night sessions
```

---

## 🔞 ADULT CONTENT & SEX WORK (Pan-European)

### Subscription Platforms
**Major Platforms:**
- OnlyFans, Fansly, JustForFans
- Patreon (adult creators)
- ManyVids, Clips4Sale
- IsMyGirl, LoyalFans

**Webcam Sites:**
- LiveJasmin, Chaturbate, BongaCams, Stripchat
- MyFreeCams, Cam4, CamSoda
- ImLive, Streamate

### Red Flags
```
FREQUENCY:
- Multiple subscriptions = €30-200/month
- Daily tip patterns = parasocial addiction
- Escalating tier upgrades

FINANCIAL IMPACT:
- Token/credit purchases (100 tokens = €10)
- Private show expenses (€100-500/session)
- Custom content requests (€50-300)

BEHAVIORAL INDICATORS:
- Late-night transactions (11pm-4am)
- Hiding pattern (unusual merchant names)
- Increasing frequency over time
- Impact on essential spending
```

### European Escort Services (Discretion Required)
```
DETECTION (Transaction Patterns Only):
- Regular cash withdrawals (€200-500) in red-light districts
- Payments to "modeling agencies" or "entertainment services"
- Hotel + cash withdrawal patterns
- Travel + cash patterns (sex tourism)

NOTE: Legal status varies by country:
- Legal: Netherlands, Germany, Austria, Switzerland, Greece
- Partially legal: Spain, Italy, Portugal
- Illegal but tolerated: France, Belgium
- Strictly illegal: Ireland, Northern Ireland

RISK: Financial strain, relationship impact, addiction patterns
```

### Sugar Dating Platforms
- SeekingArrangement, SugarDaddyMeet, etc.

```
PATTERN: Regular large transfers (€500-2000) to individuals
FREQUENCY: Monthly "allowance" pattern
RED FLAG: Financial unsustainability for income level
```

---

## 🍺 ALCOHOL, DRUGS & SUBSTANCE ABUSE

### Excessive Alcohol Spending

**UK Pub Culture:**
- Wetherspoons, Greene King, Mitchells & Butlers chains
- Local pubs: Multiple transactions per week
- Typical spend: £30-80 per visit

**European Bar Culture:**
- Irish pubs: Multiple weekly visits
- French cafés/bars
- German beer gardens, Biergartens
- Spanish tapas bars
- Dutch brown cafés

**Off-Licenses & Alcohol Retail:**
- UK: Tesco, Sainsbury's, Majestic Wine, Oddbins
- Ireland: O'Briens, SuperValu alcohol sections
- France: Nicolas, wine merchants
- Germany: Getränkemarkt

```
RED FLAGS:
FREQUENCY: >4 pub visits per week
AMOUNT: >€300/month on alcohol
PATTERN:
- Daily off-license visits
- Morning alcohol purchases (before 12pm) = dependency
- Weekday heavy drinking
- Increasing tolerance (larger purchases)
- Multiple alcohol delivery apps

HEALTH INDICATORS:
- Units >14/week (UK NHS guideline)
- Binge drinking (€100+ bar tabs)
- Solo drinking pattern (off-license, not social)
```

### Cannabis & Coffeeshop Spending (Netherlands Specific)

**Amsterdam/Netherlands Coffeeshops:**
- Regular coffeeshop transactions
- Weekly/daily pattern

```
LOW RISK: Tourist visits, occasional use
MEDIUM RISK: Weekly visits, €50-100/month
HIGH RISK: Daily visits, €200+/month, dependency pattern

DETECTION:
- Location: Amsterdam centrum, Rotterdam
- Merchant names: "Coffeeshop [name]"
- Frequency: Daily pattern
```

### Cocaine & Party Drugs (Indirect Indicators)

```
CANNOT DETECT DIRECTLY but suspicious patterns:
- Large cash withdrawals (€200-500) on weekend nights
- ATM withdrawals in nightlife districts (1am-4am)
- Pattern: Nightclub entry + ATM + cash
- Frequency: Every weekend

RISK: Financial + health + legal
NOTE: This is speculative and requires sensitivity
```

### Pharmacy Shopping (Prescription Abuse)

```
PATTERN: Multiple pharmacy visits same day/week
RED FLAGS:
- Pharmacy hopping (different locations)
- Frequent pain medication purchases
- Cash payments for prescriptions
- Cross-border pharmacy visits

EUROPEAN CONCERN:
- Prescription shopping across EU borders
- Online pharmacy abuse
- Codeine addiction (OTC in some countries)
```

---

## 💊 PRESCRIPTION & OTC DRUG ABUSE

### Online Pharmacies (EU-Wide Issue)

**Legitimate:**
- National pharmacy chains with online presence
- EU-verified online pharmacies (certified logo)

**Suspicious:**
- Non-EU pharmacies
- No prescription required claims
- Cryptocurrency payments
- Bulk orders

```
RED FLAGS:
- Multiple online pharmacy accounts
- Large quantities ordered
- Opiate-based medications
- Benzodiazepines bulk orders
- Stimulant medications (ADHD meds)
- International shipping from India/China

RISK: Addiction, legal issues, health dangers
```

---

## ☕ EXCESSIVE COFFEE & CAFÉ CULTURE (European Specific)

### UK Coffee Chains
- Starbucks, Costa, Caffè Nero, Pret A Manger
- Independent specialty coffee

### European Café Culture
**Italy:**
- Espresso bars (€1-2 per coffee, but multiple daily)
- Lavazza, Illy cafés

**France:**
- Café culture (€3-5 per coffee)
- Multiple daily café visits

**Scandinavia:**
- Premium coffee culture (€5-7 per coffee)
- "Fika" tradition in Sweden

```
COST ANALYSIS BY COUNTRY:

UK (Daily Starbucks):
- £4.50 × 5 days × 52 weeks = £1,170/year
- Home brewing: £130/year
- SAVINGS: £1,040/year

France (2x café daily):
- €4 × 2 × 300 days = €2,400/year
- SAVINGS potential: €2,000/year

Scandinavia (Premium):
- €6 × 5 days × 52 weeks = €1,560/year
- High cost due to premium pricing

DETECTION:
FREQUENCY: >5 purchases per week
THRESHOLD: >€100/month
PATTERN: Daily habit, multiple same-merchant visits
```

---

## 🚬 SMOKING & VAPING (Heavy Taxation in EU)

### Tobacco Spending

**High-Tax Countries:**
- UK: £12-15 per pack
- Ireland: €14-16 per pack
- France: €10-12 per pack
- Norway: €15-18 per pack

**Lower-Tax Countries:**
- Poland: €4-5 per pack
- Czech Republic: €4-5 per pack
- Spain: €5-6 per pack

```
PACK-A-DAY CALCULATION:

UK: £13/day × 365 = £4,745/year
Ireland: €15/day × 365 = €5,475/year
France: €11/day × 365 = €4,015/year

DETECTION:
- Daily convenience store visits
- Consistent small purchases (€10-15)
- Cross-border bulk buying pattern
- Duty-free purchases

CROSS-BORDER EVASION:
- Travel to cheaper countries for bulk purchase
- Calais cigarette runs (UK)
- Polish/Czech imports
```

### Vaping & E-Cigarettes
- Vape shop transactions
- Online e-liquid purchases
- Disposable vape purchases

```
COST: €50-150/month typical
DETECTION: Frequent vape shop visits, online orders
NOTE: Often replacement for smoking but still expensive
```

---

## 🎮 GAMING, LOOT BOXES & MICROTRANSACTIONS

### European Gaming Platforms
- Steam, Epic Games, GOG (Poland)
- PlayStation Store, Xbox Live, Nintendo eShop
- Mobile: App Store, Google Play

### Problematic Patterns

**Loot Box Addiction (EU Regulatory Concern):**
```
GAMES WITH LOOT BOXES:
- FIFA Ultimate Team (EA Sports)
- Counter-Strike skins
- Overwatch, Apex Legends
- Mobile gacha games (Genshin Impact, etc.)

RED FLAGS:
- Daily microtransactions
- Amounts: €5-10 multiple times per day
- Monthly total: >€200
- Pattern: Purchase-regret-purchase cycle

EU REGULATION:
- Belgium: Loot boxes banned (2018)
- Netherlands: Loot boxes illegal if tradeable
- UK: Under review, "predatory" concerns
```

### Gaming Subscription Stacking
```
MULTIPLE SERVICES:
- PlayStation Plus: €60/year
- Xbox Game Pass: €120/year
- Nintendo Online: €20/year
- EA Play: €30/year
- Ubisoft+: €180/year
- GeForce Now: €100/year

TOTAL: €510/year on subscriptions alone
+ Individual game purchases
+ Microtransactions

DETECTION: 3+ gaming subscriptions = potential waste
```

### Esports Betting (Growing European Problem)
- Betting on CS:GO, Dota 2, League of Legends
- Skin gambling (CS:GO skins as currency)

```
RED FLAGS:
- Underage gambling risk
- Unregulated platforms
- Cryptocurrency-based
- Addiction patterns similar to sports betting
```

---

## 🍔 FOOD DELIVERY & TAKEAWAY ADDICTION

### European Delivery Platforms

**Pan-European:**
- Uber Eats, Deliveroo, Just Eat (Takeaway.com)
- Wolt (Nordic focus)
- Glovo (Southern Europe)
- Lieferando (Germany)
- Thuisbezorgd (Netherlands)

**Country-Specific:**
- UK: Deliveroo dominant
- France: Deliveroo, Uber Eats
- Germany: Lieferando
- Netherlands: Thuisbezorgd
- Spain: Glovo, Just Eat

### Cost Analysis by Country

```
DAILY DELIVERY HABIT:

UK:
- Average order: £15
- 4x/week: £240/month = £2,880/year

France:
- Average order: €18
- 4x/week: €288/month = €3,456/year

Germany:
- Average order: €16
- 4x/week: €256/month = €3,072/year

ALTERNATIVE:
- Meal prep: €60-80/week
- SAVINGS: €2,000-2,500/year
```

### Detection Patterns
```
RED FLAGS:
FREQUENCY: >3 deliveries per week
TIMING: Late-night orders (11pm+) = impulse/laziness
PATTERN: Individual portions (not family)
COST: Premium restaurants chosen
BEHAVIOR: Complete replacement of cooking

HEALTH IMPACT:
- Poor nutrition
- Weight gain
- Reduced life skills
```

### Dark Kitchen Brands (European Trend)
- Virtual restaurants (delivery-only)
- Multiple brands from same kitchen
- Premium pricing for low-quality food

```
DETECTION: Same address, different "restaurant" names
RISK: Overpaying for mediocre food
```

---

## 🚗 TRANSPORT & MOBILITY (European Patterns)

### Rideshare Addiction

**Platform by Country:**
- UK: Uber dominant
- France: Uber, Bolt, Le Cab
- Germany: Uber (limited), FreeNow (mytaxi), Bolt
- Spain: Cabify, Uber, Bolt
- Eastern Europe: Bolt, Uber, Yandex

```
EXCESSIVE PATTERN:
- >10 rides per week
- Short distances (<2km) - walkable/bikeable
- Late-night rides (could plan transit)
- Daily commute on rideshare (expensive)

COST COMPARISON:

UK (Daily Uber Commute 5km):
- £8 × 2 trips × 22 days = £352/month = £4,224/year
- Monthly transit pass: £150/month = £1,800/year
- SAVINGS: £2,424/year

RECOMMENDATION: Bike (£500) or e-scooter (€600) + transit pass
```

### Car Expenses (Unsustainable Patterns)

**Fuel Spending:**
```
EXCESSIVE DRIVING DETECTION:
- >€300/month on fuel (personal vehicle)
- Multiple fuel stations (inefficient route planning)
- Premium fuel when not needed

EU AVERAGE: €150-200/month fuel (moderate driving)
```

**Car Lease/Finance (Lifestyle Inflation):**
```
RED FLAGS:
- Car payment >30% of income
- Luxury car unaffordable for income level
- Upgrading lease every 2 years
- Total car costs (payment + fuel + insurance) >€800/month

RECOMMENDATION: Downgrade, use public transit, car-sharing
```

### European Train Travel (First-Class Addiction)
```
PATTERN: Always booking first-class when unnecessary
EXAMPLE:
- Paris-London: First €300, Standard €60
- Annual savings: €1,000+ by using standard

DETECTION: Consistent first-class bookings on short routes
```

---

## 🛍️ SHOPPING ADDICTION & RETAIL THERAPY

### Fast Fashion (European Brands)

**Major Culprits:**
- H&M (Sweden)
- Zara, Mango (Spain)
- Primark (Ireland)
- Asos, Boohoo (UK)
- Shein (China-based, huge in EU)

```
RED FLAGS:
FREQUENCY: Weekly orders
AMOUNT: >€200/month
PATTERN:
- Multiple orders same week
- High return rate (>30%)
- Unopened packages
- Seasonal addiction (new collections)

ENVIRONMENTAL IMPACT: Fast fashion waste
FINANCIAL IMPACT: €2,400+/year on disposable clothing
```

### Luxury Shopping (Status Spending)

**European Luxury:**
- Louis Vuitton, Hermès, Chanel (France)
- Gucci, Prada (Italy)
- Burberry (UK)
- Moncler (Italy)

```
RED FLAGS:
- Luxury purchases beyond income level
- Installment plans for luxury (Klarna, etc.)
- Multiple luxury items same month
- Keeping up with influencers

DETECTION:
- Single transactions >€1,000 (handbags, etc.)
- Inconsistent with regular spending pattern
- Followed by budget crisis
```

### Amazon Addiction (Pan-European)

**Problem Patterns:**
```
PRIME ADDICTION:
- Daily/multiple daily orders
- Small items (could consolidate)
- Impulse purchases
- Subscribe & Save over-subscription

DETECTION:
- >15 Amazon transactions/month
- Late-night orders (11pm-2am) = impulse
- Total >€400/month on miscellaneous items

TIME PATTERN: Post-work binge browsing
```

### Duty-Free Shopping Addiction
```
PATTERN: Excessive airport shopping
MISCONCEPTION: "Duty-free = great deal" (often not true)
COST: €100-300 per flight on unnecessary items

DETECTION: Frequent Heinemann, World Duty Free transactions
```

---

## 💳 BUY NOW PAY LATER (BNPL) ABUSE - European Focus

### Major BNPL Platforms in Europe

**Pan-European:**
- Klarna (Sweden) - dominant in EU
- Clearpay (UK)
- PayPal Pay in 3/4

**Country-Specific:**
- UK: Klarna, Clearpay, Laybuy
- Germany: Klarna, ratenkauf
- Netherlands: AfterPay (now Riverty)
- France: Alma, Oney
- Italy: Scalapay

### Red Flags
```
EXCESSIVE BNPL USAGE:

FREQUENCY: >5 active BNPL accounts
AMOUNT: >€1,000 in BNPL debt
PATTERN:
- BNPL for essentials (groceries, bills) = financial distress
- Missed BNPL payments
- Using BNPL to buy luxuries
- Multiple BNPL providers (hitting credit limits)

EU REGULATION (Coming):
- Currently unregulated in most EU countries
- UK: FCA regulation from 2026
- Consumer debt concerns growing

RISK:
- Hidden debt (not reported to credit agencies in many countries)
- Late fees (€6-12 per missed payment)
- Credit score impact (UK)
- Debt spiral
```

### BNPL Red Flag Patterns
```
PROBLEM INDICATOR:
- Fashion BNPL: 5 Asos orders on Klarna same month
- Luxury BNPL: €800 handbag split into 4 payments
- Stacking: Active installments from Klarna, Clearpay, PayPal simultaneously

RECOMMENDATION: Consolidate, pay off, reduce to 0-1 BNPL max
```

---

## 💰 PAYDAY LOANS & HIGH-INTEREST DEBT (EU Variations)

### UK Payday Lenders
- Wonga (defunct but similar operators exist)
- QuickQuid, Sunny, Lending Stream
- Cash Converters, Money Shop

```
UK REGULATION: FCA caps at 0.8% per day
STILL EXPENSIVE: €500 loan for 30 days = €620 repayment

DETECTION:
- Any payday loan usage = CRITICAL
- Loan cycling (paying with new loan)
- Multiple lenders
```

### European Consumer Credit
**Problem Lenders:**
- France: Crédit revolving (revolving credit at 15-20% APR)
- Germany: Ratenkauf at high rates
- Italy: Prestiti personali
- Spain: Créditos rápidos

```
RED FLAGS:
- Interest rates >15% APR
- Short-term loans (<3 months)
- Multiple lenders
- Debt consolidation loans (often trap)
```

### Pawnbrokers & Pawning
**European Chains:**
- UK: Cash Converters, H&T Pawnbrokers, Ramsdens
- Europe: Various local pawnshops

```
DETECTION: Regular pawning transactions
RISK: Desperation indicator, expensive credit
RECOMMENDATION: Seek free debt counseling
```

---

## 🏠 RENT-TO-OWN & INSTALLMENT TRAPS

### European Rent-to-Own
**UK:** BrightHouse (defunct), Perfect Home
**Concept:** Pay weekly for furniture/electronics at 3-4x retail price

```
EXAMPLE:
- TV retail: €500
- Rent-to-own: €15/week × 104 weeks = €1,560
- MARKUP: 212% over 2 years

DETECTION: Weekly payments to furniture stores
RISK: Poverty trap, predatory pricing
RECOMMENDATION: Save first, buy outright
```

---

## 📱 MOBILE & PHONE ADDICTION

### Premium Phone Contracts (UK/EU)

```
PROBLEM PATTERN:
- Upgrading to latest iPhone every year
- €70-90/month phone contract (excessive)
- Multiple devices on contract

COST: €90/month × 12 = €1,080/year
ALTERNATIVE: SIM-only €20/month + €500 phone = €740 total
SAVINGS: €340/year

DETECTION: Multiple phone contracts, yearly upgrades
```

### In-App Purchases (Mobile Games)
```
EUROPEAN MOBILE GAMING:
- Candy Crush, Clash of Clans, PUBG Mobile
- Loot box mechanics

RED FLAGS:
- Daily microtransactions (€0.99, €4.99 repeatedly)
- Monthly total >€100
- Children's games (parent's card)

REGULATION: EU investigating loot boxes
```

---

## 🎓 EDUCATION & TUTORING (European Variations)

### University Expenses (Not UK - Different System)

**UK Student Finance:**
```
DETECTION:
- Student loan not covering living costs
- Overdraft addiction (student accounts)
- Credit card debt accumulation
- Working excessive hours impacting study

PROBLEM: "Lifestyle creep" on student budget
```

**EU Countries (Low/Free Tuition but Living Costs):**
- Germany: Free tuition but €850/month living costs
- France: Low tuition (€200-600/year) but expensive cities
- Netherlands: €2,000-2,300/year tuition + living

### Private Tutoring Addiction
```
PATTERN: Excessive tutoring spending
COUNTRIES: UK, Ireland (competitive schooling)
COST: €50-100/hour

RED FLAGS:
- >€500/month on tutoring
- Multiple subjects
- Enrichment classes piling up

RECOMMENDATION: School resources, study groups
```

---

## 💼 TAX EVASION INDICATORS (Report Suspicious Activity)

### Cash-Heavy Business (Potential Evasion)
```
WARNING: These are indicators only, not proof

PATTERN:
- Business owner with very low card usage
- Excessive cash withdrawals
- Income/spending mismatch
- Cross-border cash movements

NOTE: Banks required to report under EU AML directives
NOT YOUR RESPONSIBILITY: Just flag unusual patterns
```

### Cryptocurrency Tax Evasion
```
PATTERN:
- Large crypto purchases
- No declared crypto income on tax returns
- P2P crypto exchanges (LocalBitcoins, etc.)

EU REGULATION: Crypto reporting requirements increasing
NOTE: Privacy vs. compliance concerns
```

---

## 🌍 CROSS-BORDER & EXPAT SPENDING ISSUES

### Living Beyond Means in Expensive Cities
```
EUROPEAN EXPENSIVE CITIES:
- London: €3,500+/month minimum
- Zurich: €4,000+/month minimum
- Oslo: €3,800+/month minimum
- Paris: €2,800+/month minimum
- Copenhagen: €3,200+/month minimum
- Dublin: €2,600+/month minimum

RED FLAGS:
- Income insufficient for city costs
- Accumulating debt
- No savings despite high income
- Lifestyle inflation (restaurants, bars, Ubers)

RECOMMENDATION: Move to cheaper area or reduce discretionary spending
```

### Currency Exchange Addiction (Forex Trading)
```
PATTERN: Frequent forex trading platforms
PLATFORMS: Plus500, eToro, Trading 212, IG Index

RED FLAGS:
- Daily trading activity
- Leverage usage (high risk)
- Losses accumulating
- Depositing more to cover losses

RISK: 80% of retail forex traders lose money
RECOMMENDATION: Index funds, not day trading
```

### Overseas Property Investment (Scams)
```
PATTERN: Spanish villa scam, Cyprus property
WARNING SIGNS:
- Off-plan purchases in risky markets
- Developer payments
- High-pressure sales
- Timeshare purchases (still exist!)

EU CONCERN: Brexit-related property issues
```

---

## 🚨 FRAUD & SCAM VICTIMS (Protection Not Blame)

### Romance Scams (European Victims)
```
PATTERN:
- Regular transfers to individuals (€500-5,000)
- Western Union, MoneyGram usage
- International wire transfers
- Cryptocurrency sending
- Gift card purchases (iTunes, Amazon)

INDICATORS:
- Never met in person
- Escalating requests
- Emergencies requiring money
- Investment opportunities

ACTION: Alert customer, provide fraud resources
EU RESOURCE: European Consumer Centre Network
```

### Investment Scams (Boiler Room Fraud)
```
COMMON IN: UK, Ireland, Netherlands
PATTERN:
- Cryptocurrency investment scams
- Land banking, wine investment
- Carbon credit fraud
- Rare earth metals

DETECTION:
- Large transfers to unknown companies
- Offshore accounts
- High-pressure sales calls
- Too-good-to-be-true returns

EU WARNING: ESMA investor warnings list
```

### Online Shopping Scams
```
PATTERN:
- Payment to suspicious websites
- No delivery received
- Fake luxury goods
- Counterfeit tickets

PLATFORMS TO WATCH:
- Suspicious social media sellers
- Unknown websites (not .co.uk, .de, .fr domains)
- Too-cheap prices

PROTECTION: EU Distance Selling Directive (14-day returns)
```

---

## 🏥 PRIVATE HEALTHCARE OVERUSE (European Context)

### UK Private Healthcare
```
PATTERN: NHS available but using private
COSTS:
- Private GP: £150-250 per visit
- Private scans: £300-800
- Private surgery: €5,000-15,000

RED FLAGS:
- Frequent private GP visits for minor issues
- Overuse of private specialists
- Medical tourism for cosmetic procedures

RECOMMENDATION: Use NHS for non-urgent care
```

### Cosmetic Procedures Addiction
```
POPULAR IN: UK, France, Spain, Turkey (medical tourism)
PROCEDURES:
- Botox: €300-500 every 4 months
- Fillers: €400-800 every 6 months
- Hair transplant tourism (Turkey): €2,000-5,000
- Dental tourism (Hungary, Poland): €5,000-10,000

RED FLAGS:
- Frequent cosmetic procedures
- Medical tourism to Turkey, Poland
- Body dysmorphia spending pattern
- Installment plans for cosmetics

RISK: Addiction, complications, financial strain
```

---

## 🎪 SEASONAL & EVENT-BASED OVERSPENDING

### Christmas Overspending (European Pattern)
```
TYPICAL OVERSPEND: €1,000-2,000 beyond budget

DETECTION:
- November-December spending spike
- Multiple gift purchases
- Credit card usage surge
- January debt hangover

COUNTRIES WITH EXTREME CHRISTMAS SPENDING:
- UK: Average €800-1,000 on gifts
- Germany: Christmas markets + gifts €600-800
- France: 13th-month salary often spent entirely

RECOMMENDATION: Budget €500, start saving in July
```

### Festival & Summer Holiday Overspending
```
EUROPEAN FESTIVALS:
- Glastonbury (UK): £350 ticket + £500 expenses
- Tomorrowland (Belgium): €400 ticket + €1,000 expenses
- Oktoberfest (Germany): €1,000+ for weekend

SUMMER HOLIDAYS:
- All-inclusive trap: €2,000 + €1,000 spending money wasted
- Festival tourism: €1,500-3,000 total

DETECTION: June-August spending spike, festival tickets, budget airlines
```

### Black Friday / Sales Addiction
```
EUROPEAN PHENOMENON: Growing since 2010s

PATTERN:
- Large purchases on sale days
- Items not needed
- FOMO (Fear of Missing Out) spending
- Returns pattern afterwards

COUNTRIES: UK, Germany, France most affected
DETECTION: November spending spike, multiple retailers same day
```

---

## 🏋️ FITNESS & WELLNESS SCAMS

### Gym Membership Waste
**European Gym Chains:**
- UK: PureGym, The Gym Group, Virgin Active, David Lloyd
- EU: Basic-Fit, Fitness First, Holmes Place

```
PROBLEM:
- Signed up: Never goes
- Premium tier: Unused facilities
- Multiple memberships: Overlap

COST: €40-100/month × 12 = €480-1,200/year wasted

DETECTION:
- Gym membership >2 months with no visits (no swipe data)
- Multiple gym memberships
- PT sessions unused

RECOMMENDATION: Cancel, use free outdoor exercise, home workouts
```

### Supplement & Protein Powder Addiction
```
PATTERN: Monthly supplement subscriptions
COST: €100-300/month

RED FLAGS:
- Multiple supplement brands
- Unproven products (fat burners, testosterone boosters)
- MLM products (Herbalife, Juice Plus)

RECOMMENDATION: Basic protein powder + balanced diet sufficient
```

### Wellness Scams (Alternative Medicine)
```
EUROPEAN WELLNESS TRENDS:
- Homeopathy (no scientific backing)
- Crystal healing
- Detox programs (unnecessary)
- Vitamin IV drips (€150-300)

DETECTION: Regular payments to "wellness centers"
RISK: Expensive, ineffective, replacing real medical care
```

---

## 🐕 PET SPENDING (European Pet Culture)

### Excessive Pet Spending
```
REASONABLE: €50-100/month (food, basic care)
EXCESSIVE: €300+/month

RED FLAGS:
- Designer pet purchases (€2,000+ dogs)
- Pet boutique shopping
- Excessive vet visits for minor issues
- Pet insurance gold tier (unnecessary)
- Pet spa/grooming weekly

DETECTION: Premium pet stores, frequent grooming, boutique brands
```

---

## 👶 CHILDCARE & PARENTING OVERSPENDING

### Childcare Costs (European Variations)

**Expensive Countries:**
- UK: €1,000-1,500/month per child (London)
- Ireland: €800-1,200/month per child
- Switzerland: €2,000+/month per child

**Cheaper (Government Support):**
- France: €200-400/month (subsidized)
- Germany: €100-300/month (depends on state)
- Nordic countries: €200-400/month (heavy subsidies)

```
RED FLAGS:
- Premium nursery when standard available
- Nanny when childminder cheaper
- After-school activities overload (€500+/month)

RECOMMENDATION: Use state schemes, share childcare, realistic activity levels
```

### Kids' Activities Overload
```
PATTERN: Child enrolled in 5+ paid activities
COST:
- Football: €50/month
- Swimming: €60/month
- Music lessons: €80/month
- Tutoring: €200/month
- Dance: €50/month
TOTAL: €440/month per child

RED FLAGS: Overbooked child, financial strain, keeping up with others
RECOMMENDATION: 2-3 activities max
```

---

## 🔧 DETECTION ALGORITHM SUMMARY

```typescript
interface EuropeanBehaviorRules {
  // Gambling (Most Serious)
  gambling: {
    online_betting: { threshold: '€100/month', frequency: '>3/week', severity: 'HIGH' },
    casino: { threshold: '€200/month', frequency: '>2/week', severity: 'HIGH' },
    lottery_excessive: { threshold: '€100/month', frequency: 'daily', severity: 'MEDIUM' },
    fobt: { threshold: '€50/session', frequency: 'daily', severity: 'CRITICAL' },
  },

  // Adult Content
  adult_content: {
    subscriptions: { threshold: '€50/month', count: '>2', severity: 'HIGH' },
    webcam_tips: { threshold: '€200/month', pattern: 'escalating', severity: 'HIGH' },
    escort_services: { pattern: 'cash_withdrawal_redlight', severity: 'HIGH' },
  },

  // Substance
  alcohol: {
    pubs: { threshold: '€300/month', frequency: '>4/week', severity: 'HIGH' },
    off_license: { pattern: 'daily', threshold: '€200/month', severity: 'MEDIUM' },
    morning_purchases: { time: '<12pm', severity: 'HIGH' },
  },

  tobacco: {
    daily_smoking: { threshold: '€10/day', annual: '€3,650', severity: 'MEDIUM' },
    cross_border: { pattern: 'bulk_cheap_country', severity: 'LOW' },
  },

  // Lifestyle
  coffee: {
    daily_habit: { threshold: '€100/month', frequency: '>5/week', severity: 'LOW' },
    multiple_daily: { frequency: '>10/week', severity: 'MEDIUM' },
  },

  food_delivery: {
    excessive: { threshold: '€200/month', frequency: '>3/week', severity: 'MEDIUM' },
    replacement: { pattern: 'no_grocery_shopping', severity: 'HIGH' },
  },

  rideshare: {
    daily: { threshold: '€400/month', frequency: '>20/month', severity: 'MEDIUM' },
    short_trips: { avg_distance: '<2km', severity: 'MEDIUM' },
  },

  // Shopping
  fast_fashion: {
    weekly: { threshold: '€200/month', returns: '>30%', severity: 'MEDIUM' },
    late_night: { time: '11pm-3am', frequency: '>8/month', severity: 'MEDIUM' },
  },

  luxury: {
    beyond_means: { single_item: '>€1000', income_ratio: '>20%', severity: 'HIGH' },
  },

  // Debt
  bnpl: {
    excessive: { active_accounts: '>3', total_debt: '>€1000', severity: 'MEDIUM' },
    essentials: { category: 'groceries/bills', severity: 'HIGH' },
  },

  payday_loans: {
    any_usage: { threshold: '€0', severity: 'CRITICAL' },
    cycling: { pattern: 'loan_to_pay_loan', severity: 'CRITICAL' },
  },

  // Gaming
  gaming_micro: {
    daily: { threshold: '€200/month', frequency: '>15/month', severity: 'MEDIUM' },
    loot_boxes: { pattern: 'fifa_ultimate_team', severity: 'HIGH' },
  },

  // Subscriptions
  subscription_creep: {
    excessive: { count: '>5', unused: '>2', severity: 'MEDIUM' },
    duplicates: { pattern: 'netflix+disney+hbo+prime', severity: 'LOW' },
  },

  // Healthcare
  private_healthcare: {
    overuse: { threshold: '€500/month', availability: 'NHS_available', severity: 'LOW' },
    cosmetic: { frequency: '>4/year', severity: 'MEDIUM' },
  },

  // Seasonal
  christmas_overspend: {
    spike: { threshold: '€1000', month: 'December', severity: 'MEDIUM' },
  },

  // Fraud Victim Indicators
  romance_scam: {
    transfers: { pattern: 'individual_overseas', threshold: '>€2000', severity: 'CRITICAL' },
    gift_cards: { frequency: '>5/month', severity: 'CRITICAL' },
  },
}
```

---

## 🌍 COUNTRY-SPECIFIC CULTURAL CONSIDERATIONS

### UK
- Pub culture: Social norm but can become problem
- Betting shops on every high street: Normalized gambling
- Consumer credit culture: BNPL, credit cards
- Expensive cities: London lifestyle inflation

### Ireland
- Paddy Power dominance: Gambling culture
- High cost of living: Dublin rent crisis
- Pub culture: Social but risky
- Tax on alcohol: €15+ per pack of cigarettes

### Germany
- Cash culture: Hard to detect some spending
- Beer culture: Moderate but consistent
- Discount shopping: Aldi/Lidl preference (positive)
- Eco-consciousness: Bike culture (positive)

### France
- Café culture: Daily espresso normal
- Wine culture: Moderate consumption normal
- Fashion culture: Higher clothing spending
- Vacation culture: August overspending

### Netherlands
- Coffeeshop culture: Cannabis normalized
- Cycling culture: Low transport costs (positive)
- BNPL usage: AfterPay popular
- Frugal culture: Generally good financial habits

### Spain/Italy
- Cash culture: Harder to track
- Late dining: Restaurant culture
- Family support: Lower individual debt
- Tax evasion culture: Cash transactions

### Nordic Countries
- High costs: Everything expensive
- Alcohol monopoly: SystemBolaget reduces addiction
- Digital payments: Easy to track all spending
- Social safety net: Lower desperation debt

### Eastern Europe
- Cash dominance: Hard to track
- Lower costs: Less overspending risk
- Remittances: Sending money home (not waste)
- Emerging consumer credit: Growing risk

---

## 📊 SCORING & SEVERITY MATRIX

```
FINANCIAL HEALTH SCORE (0-100):

CRITICAL (0-25):
- Payday loan cycling
- Gambling >50% disposable income
- Debt spiral
- Essential bills unpaid
→ IMMEDIATE INTERVENTION

HIGH RISK (26-50):
- Multiple high-risk behaviors
- Increasing debt
- Gambling addiction
- Substance abuse spending
→ URGENT SUPPORT NEEDED

MEDIUM RISK (51-70):
- Overspending in 2-3 categories
- Some debt accumulation
- Lifestyle creep
- No emergency fund
→ FINANCIAL COUNSELING

LOW RISK (71-85):
- Minor overspending
- Room for improvement
- Generally stable
→ OPTIMIZATION ADVICE

HEALTHY (86-100):
- Good habits
- Emergency fund
- Saving consistently
- Minimal waste
→ MAINTAIN & ENCOURAGE
```

---

## 🆘 EUROPEAN CRISIS RESOURCES

### Pan-European
- European Consumer Centre Network: ec.europa.eu/consumers
- EU Debt Advice: Ask local country

### UK
- StepChange: 0800 138 1111
- Citizens Advice: citizensadvice.org.uk
- Gambling: GamCare 0808 8020 133
- Alcohol: Drinkline 0300 123 1110

### Ireland
- MABS: 0761 07 2000
- Gamblers Anonymous: 01 872 1133
- Alcoholics Anonymous: 01 842 0700

### Germany
- Schuldnerberatung: caritas.de
- Bundeszentrale für gesundheitliche Aufklärung: bzga.de

### France
- CRESUS: cresus-iledefrance.org
- Info Service: 0 800 108 800

### Netherlands
- GGZ Mental Health
- Schuldhulpverlening

---

This comprehensive European ruleset covers all major problematic spending patterns detectable from bank statements across the EU + UK + EFTA countries. 🌍

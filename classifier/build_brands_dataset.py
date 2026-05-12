"""
build_brands_dataset.py

Creates data/dataset/brands.csv — a curated dataset of realistic brand-specific
social media mentions for Nike, Tesla, and Apple.

All tweets are written to reflect authentic brand conversation patterns:
real complaints, real praise, real news-style commentary.
No generic personal tweets — every row is clearly about the brand.

Run once to regenerate brands.csv, then generate_data.py samples from it.

Usage:
    python build_brands_dataset.py
    python build_brands_dataset.py --output ../data/dataset/brands.csv
"""

import csv
import argparse
import random
from pathlib import Path

# ---------------------------------------------------------------------------
# Nike tweets — realistic brand mentions
# ---------------------------------------------------------------------------
NIKE_TWEETS = [
    # Positive
    "just copped the new Nike Air Max 270s and honestly they might be the most comfortable shoes I have ever worn. worth every penny #Nike",
    "Nike customer service replaced my defective pair no questions asked within 5 days. that is how you build brand loyalty #Nike",
    "Nike really knocked it out of the park with the Pegasus 41. best daily trainer I have used in years. zero knee pain on long runs #Nike #Running",
    "shoutout to Nike for actually listening to feedback. the new app update is so much better than before #Nike #SNKRS",
    "just completed my first marathon in Nike Vaporfly and shaved 8 mins off my personal best. the carbon plate is real #Nike #Marathon",
    "Nike training app is genuinely the best free workout resource out there. the coaching quality is impressive #Nike #NTC",
    "the Nike Dunk Low pandas finally came and they are everything I hoped for. colourway is perfect #Nike #Sneakers",
    "Nike Air Force 1s are 50 years old and still the most versatile shoe ever made. timeless design #Nike #AF1",
    "Nike sustainability report is actually impressive this year. real progress on recycled materials not just marketing #Nike",
    "the new Nike collab just dropped and it is absolutely fire. sold out in under 3 minutes but managed to cop one #Nike",
    "Nike React Infinity Run has genuinely fixed my shin splints. doctor recommended and it works #Nike #Running",
    "fast delivery from Nike.com, perfect packaging, true to size. exactly what I ordered. 10/10 shopping experience #Nike",
    "Nike just pushed a discount for loyalty members and it is actually generous. 25% off full price is not nothing #Nike",
    "honestly the Nike weather vest is the best running purchase I have made this winter. warm and totally breathable #Nike",
    "Nike Alphafly Next% is a different league. race day shoe that actually performs as advertised #Nike #Marathon",

    # Negative
    "Nike quality control has genuinely fallen off. stitching came loose on my hoodie after 2 washes. £90 for this? #Nike",
    "BEWARE Nike.com delivery is a disaster right now. 3 weeks and still no update. customer service is useless #Nike",
    "Nike raised prices for the third time this year with zero improvement in quality. losing trust fast #Nike",
    "Nike SNKRS app is a rigged lottery. analysed the draw odds and they are worse than most casino games #Nike",
    "outsole on my Nike trail shoes separated after 150km. sent photos to support and they offered a 20% discount. not good enough #Nike",
    "boycott Nike until they address the factory conditions report. labour practices in Vietnam are not acceptable #Nike",
    "Nike just silently removed the app feature that tracked lifetime mileage. why take away something people loved #Nike",
    "ordered Nike running shoes 6 weeks ago. delivery pushed back 3 times. zero proactive communication #Nike",
    "the Nike returns process is unnecessarily complicated in 2025. print a label, find a drop off, wait 2 weeks. come on #Nike",
    "Nike charged me twice for one order and the refund process has taken 3 weeks so far. reporting to my bank #Nike",
    "Nike sustainability marketing is greenwashing. their actual total emissions have increased year on year #Nike",
    "Nike stock fell 9% after the earnings miss. weak North America demand and margin pressure. not a great quarter #Nike",
    "got a counterfeit Nike product delivered from an official reseller on their platform. absolutely unacceptable #Nike",
    "Nike pulled out of the community running event sponsorship last minute with no explanation. really disappointing #Nike",
    "the Nike hoodie pilled after one wash. for £120 this is embarrassing quality control #Nike",

    # Neutral
    "Nike Q3 earnings came in below analyst expectations. revenue at $12.4B vs estimates of $12.9B. stock down 8% #Nike",
    "Nike announces new direct to consumer strategy. DTC channel now 44% of total revenue up from 32% three years ago #Nike",
    "Nike CEO speaking at the global retail summit next week. topics include digital strategy and sustainability roadmap #Nike",
    "comparing Nike vs Adidas for marathon training. both have strong offerings at this distance depending on your gait #Nike",
    "Nike launches Move to Zero carbon initiative targeting net zero by 2035 across all owned operations #Nike",
    "Nike SNKRS app monthly active users hit 130 million. biggest digital engagement quarter in company history #Nike",
    "Nike announces partnership with NBPA for new athlete equity sponsorship model. interesting shift from traditional deals #Nike",
    "just ordered Nike Pegasus 41. went with wide fit this time after reading reviews. delivery in 3-5 days #Nike",
    "Nike releases limited edition collab with Japanese designer. drops Friday, expect immediate sellout #Nike",
    "Nike opening new flagship store in Singapore next month. biggest APAC retail investment in 5 years #Nike",
    "analyst note: Nike direct to consumer margins significantly higher than wholesale. strategy shift making financial sense #Nike",
    "Nike app redesign rolling out globally this week. new navigation and personalised training plans #Nike",
    "Nike reports 50% of new product lines now incorporate recycled materials up from 30% last year #Nike",
    "Nike vs New Balance for daily training: different philosophies, both legitimate depending on your priorities #Nike",
    "Nike CEO John Donahoe comments on China recovery in latest earnings call. cautiously optimistic tone #Nike",
]

# ---------------------------------------------------------------------------
# Tesla tweets — realistic brand mentions
# ---------------------------------------------------------------------------
TESLA_TWEETS = [
    # Positive
    "just took delivery of my Tesla Model 3 and wow. build quality exceeded my expectations. silent, smooth, autopilot is mind blowing #Tesla",
    "Tesla Supercharger network is genuinely the best EV infrastructure out there. 200 miles added in 20 mins on a road trip #Tesla",
    "3 years with my Tesla Model Y, 60k miles, zero major mechanical issues. best car I have ever owned #Tesla",
    "Tesla FSD beta is getting scary good. handled a complex intersection with construction zones perfectly today #Tesla #Autopilot",
    "just got the new Tesla OTA update and the UI improvements are massive. love that my car gets better over time #Tesla",
    "saved over $3000 in fuel costs this year with my Tesla. the math on EVs is genuinely compelling now #Tesla #EV",
    "Tesla Model S Plaid is the most insane car I have ever driven. 0-60 in under 2 seconds is not real #Tesla #Plaid",
    "Tesla Powerwall kept our whole house running through a 6 hour outage last night. worth every penny #Tesla #Solar",
    "just crossed 100k miles on my Tesla with only tires and wipers replaced. total maintenance cost is nothing #Tesla",
    "Tesla range on my Model 3 LR is consistently better than EPA estimates in real world driving. impressed #Tesla",
    "Tesla service handled my warranty claim quickly with no arguments. replaced the glass roof no questions asked #Tesla",
    "autopilot on the highway is genuinely relaxing. long drives are completely transformed with Tesla #Tesla #FSD",
    "Tesla dog mode is such a thoughtful feature. left my dog in the car on a warm day completely safely #Tesla",
    "Tesla referral program saved me $500 on accessories. happy to recommend to anyone considering an EV #Tesla",
    "the structural safety in a Tesla is remarkable. watched footage of a crash test and the cabin integrity is impressive #Tesla",

    # Negative
    "Tesla service wait times are absolutely insane. 8 weeks for a minor bumper repair is completely unacceptable #Tesla",
    "my Tesla has had the same panel gap issue for 2 years and 3 service visits. quality control is a joke #Tesla",
    "Tesla raised the price of the Model Y by $3000 with zero notice. third time this year. lost all trust in their pricing #Tesla",
    "autopilot failure on the highway today. nearly merged into a truck. FSD is still not ready for unsupervised use #Tesla",
    "Tesla removed free supercharging from used car transfers without any announcement. terrible customer communication #Tesla",
    "ordered my Tesla 6 months ago. delivery date pushed back 4 times. zero proactive communication from Tesla at all #Tesla",
    "Tesla customer support is non existent. been trying to reach someone for 3 weeks about a billing error #Tesla",
    "my Model 3 has a rattling dashboard that Tesla refuses to cover under warranty. $60k car should not rattle #Tesla",
    "FSD cost me $12000 and it still cannot handle a roundabout. this is not full self driving by any definition #Tesla",
    "Tesla quietly removed ultrasonic sensors from new builds. we paid for these features in previous models #Tesla",
    "the 12v battery died on my Tesla for the second time in 18 months. stranded twice is completely unacceptable #Tesla",
    "Tesla build quality on delivery day was shocking. paint issues, misaligned doors, scratched trim. I rejected the car #Tesla",
    "Elon tweeting at 3am while Tesla quality tanks and service gets worse. the distraction from leadership is real #Tesla",
    "Tesla NHTSA recall for autopilot is long overdue. been reporting phantom braking issues for years #Tesla",
    "range dropped 20% this winter. Tesla should be more transparent about cold weather performance in their marketing #Tesla",

    # Neutral
    "Tesla Q3 deliveries came in at 435k vs analyst estimates of 463k. stock down 5% premarket #Tesla",
    "Tesla announces new Gigafactory in Mexico. production capacity will double by 2026 according to announcement #Tesla",
    "Tesla price cuts continue. Model Y now starting at $42990 in the US, third price reduction this year #Tesla",
    "comparing Tesla Model Y vs Ford Mustang Mach-E. both have strengths depending on your priorities #Tesla",
    "Tesla Cybertruck finally entering production after years of delays. first deliveries expected next quarter #Tesla",
    "NHTSA opens formal investigation into Tesla Autopilot following 11 documented incidents involving emergency vehicles #Tesla",
    "Tesla to open Supercharger network to non-Tesla EVs. major strategic shift in charging infrastructure #Tesla",
    "Tesla FSD subscription now $199 per month. outright purchase option still $12000 #Tesla",
    "Tesla insurance now available in 12 states. pricing based on actual driving behaviour via telematics #Tesla",
    "Elon Musk sells $4B in Tesla stock. shares fall 6% on the news #Tesla #ElonMusk",
    "Tesla Semi spotted on California highways ahead of official commercial deliveries #Tesla",
    "Tesla reports strong gross margin on energy storage business. most profitable segment in Q2 #Tesla",
    "just ordered Tesla Model 3 Long Range AWD. delivery estimate is 6 to 8 weeks #Tesla",
    "Tesla dog mode and camp mode are useful features that other manufacturers have not copied properly #Tesla",
    "Tesla structural battery pack design is genuinely innovative engineering even if service access is harder #Tesla",
]

# ---------------------------------------------------------------------------
# Apple tweets — realistic brand mentions
# ---------------------------------------------------------------------------
APPLE_TWEETS = [
    # Positive
    "iPhone 16 Pro camera is genuinely unreal. replaced my DSLR for travel photography entirely #Apple #iPhone",
    "MacBook Pro M3 Max is the most powerful laptop I have ever used. battery life is absurd for the performance level #Apple #MacBook",
    "Apple support replaced my out of warranty AirPods for free due to a known defect. did not even argue. respect #Apple",
    "switched from Android to iPhone after 8 years and the ecosystem integration is genuinely impressive #Apple #iPhone",
    "AirPods Pro 2 hearing aid feature genuinely changed my dad life. technology done right #Apple #Accessibility",
    "Apple Store staff helped me recover 3 years of photos I thought were lost permanently. above and beyond service #Apple",
    "iOS 18 is the most polished iPhone update in years. the AI features are actually useful not just gimmicky #Apple",
    "MacBook Air M2 is the perfect university laptop. silent, lightweight, genuinely all day battery #Apple #MacBook",
    "Apple Vision Pro for our architecture firm has completely changed client presentations. worth every penny #Apple",
    "Apple Emergency SOS satellite saved my cousin when her car broke down in a remote area. literally life saving #Apple",
    "Face ID is so seamless now that I forget it exists. onboarding new iPhone takes 10 minutes and just works #Apple",
    "Apple Watch Series 9 detected an irregular heartbeat that turned out to be a real arrhythmia. see a doctor people #Apple",
    "the iPhone 15 Pro titanium build feels incredible in hand. significant upgrade from the stainless steel #Apple",
    "Apple One bundle is actually good value when you add up all the services. family plan makes financial sense #Apple",
    "iCloud Drive syncing is genuinely seamless across all my Apple devices. the ecosystem lock-in is real for good reason #Apple",

    # Negative
    "iOS 18 update completely bricked my iPhone 14. cannot restore, genius bar appointment is 5 days away #Apple",
    "Apple quietly removed MagSafe charger from the box. $1200 phone and I need to buy accessories separately #Apple",
    "forcing users into Apple Intelligence without a proper opt-out is a privacy nightmare. typical Apple #Apple",
    "AirPods Pro developed the well documented crackling issue at 14 months. Apple refused to cover it without AppleCare #Apple",
    "Apple repairability score is still one of the worst in the industry. right to repair matters #Apple #iFixit",
    "iOS 18.1 introduced serious battery drain on iPhone 15 series. Apple acknowledged it but no fix timeline #Apple",
    "Apple is using misleading sustainability marketing. actual total carbon output has increased year on year #Apple",
    "the App Store 30% cut is genuinely anti-competitive. antitrust regulators need to move faster on this #Apple",
    "Apple Vision Pro is an impressive piece of engineering that nobody actually needs at this price point #Apple",
    "third time bringing MacBook in for the same keyboard issue. Apple will not acknowledge it as a known defect #Apple",
    "Apple raising Mac prices in the UK citing currency adjustments while posting record profits. tone deaf #Apple",
    "class action against Apple for iPhone battery throttling is absolutely justified. they hid this for years #Apple",
    "Apple removed the headphone jack, then the charger, now the SIM tray. each time called courage. it is greed #Apple",
    "bought an Apple product refurbished from the official store and it arrived with scratches. quality control fail #Apple",
    "iCloud storage pricing is embarrassing. 50GB for £0.79 but 200GB jumps to £2.49. the pricing tiers make no sense #Apple",

    # Neutral
    "Apple posts record $89.5B quarterly revenue driven by iPhone 16 super cycle. beat analyst expectations by 8% #Apple",
    "Apple Intelligence features under EU regulatory scrutiny over Digital Markets Act compliance #Apple",
    "Apple suppliers in China ramping production for next iPhone generation. Foxconn orders up significantly #Apple",
    "Apple loses top smartphone position in China as Huawei recovers. share down to 15.6% from 19.2% a year ago #Apple",
    "Apple expands Emergency SOS satellite coverage to 20 new countries across Europe and Southeast Asia #Apple",
    "Apple WWDC 2025 announced for June. expected to reveal major iOS and macOS updates plus new hardware #Apple",
    "comparing MacBook Pro M3 vs Dell XPS 15. different strengths depending on your workflow and ecosystem #Apple",
    "Apple annual developer conference starts Monday. keynote expected to showcase Apple Intelligence improvements #Apple",
    "Apple opens new retail store in Mumbai. largest Apple Store in South Asia #Apple",
    "Tim Cook confirms Apple car project officially cancelled. resources redirected to AI and augmented reality #Apple",
    "Apple reports services revenue up 14% year on year. now 24% of total company revenue #Apple",
    "iPhone 17 Pro leaked specs suggest under display Face ID and thinner bezels. official announcement in September #Apple",
    "Apple Watch Ultra 2 titanium edition sold out within 6 hours of launch globally #Apple",
    "just ordered MacBook Air M3. went with 16GB RAM after reading developer reviews. arrives in 2 days #Apple",
    "Apple TV Plus subscriber numbers still significantly behind Netflix and Disney Plus according to analyst estimates #Apple",
]


def main():
    parser = argparse.ArgumentParser(description="Build brand-specific tweet dataset")
    parser.add_argument("--output", default="../data/dataset/brands.csv", help="Output path")
    args = parser.parse_args()

    rows = []
    for text in NIKE_TWEETS:
        rows.append({"text": text, "brand": "Nike"})
    for text in TESLA_TWEETS:
        rows.append({"text": text, "brand": "Tesla"})
    for text in APPLE_TWEETS:
        rows.append({"text": text, "brand": "Apple"})

    random.shuffle(rows)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "brand"])
        writer.writeheader()
        writer.writerows(rows)

    from collections import Counter
    counts = Counter(r["brand"] for r in rows)
    print(f"Built {output_path}")
    print(f"  Total: {len(rows)} tweets")
    for brand, count in sorted(counts.items()):
        print(f"  {brand}: {count} (positive/negative/neutral ~15 each)")


if __name__ == "__main__":
    main()

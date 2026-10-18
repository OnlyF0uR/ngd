# Site playbooks: what each kind of site needs, and why

Before proposing a sitemap or presets, work out what *this kind* of business needs its website to do. A dentist, a SaaS start-up and a wedding photographer all want "more customers", but visitors arrive with different questions, doubts and next steps. Find the closest playbook (or combine two), then adapt it to the brief. Each lists the visitor's real question, the primary conversion, must-have pages and sections, the trust signals that matter, structured data, the SEO angle, and common mistakes.

## Contents
1. Local service business (trades, cleaning, removals, garages)
2. Health, wellness and beauty (clinics, physio, dentists, salons, gyms, spas)
3. Professional services (lawyers, accountants, consultants, architects)
4. SaaS, apps and digital products
5. Agencies, studios and freelancers (portfolio)
6. Hospitality (restaurants, cafés, hotels, venues)
7. Real estate and property
8. Events, conferences and courses
9. Personal brands, coaches and creators
10. B2B industrial and manufacturing
11. Non-profits and associations
12. Campaign landing pages (ads, launches, lead magnets)

## 1. Local service business
- **Visitor's question:** "Can you do my job, near me, soon, for a fair price, and are you reliable?"
- **Primary conversion:** request a quote or call back; phone and WhatsApp clicks on mobile.
- **Pages:** home, one page per core service (each targeting "service + city"), service area, reviews/projects, about (real team), contact; FAQ on pricing and process.
- **Sections that convert:** trust bar right under the hero (rating + review count, years in business, certifications, guarantee); before/after or project gallery; "how it works in 3 steps"; price indications or "from €…" (people leave when they can't gauge the cost); service area map or list; sticky mobile call/WhatsApp/quote bar.
- **Trust:** real photos of team and vans, certifications/memberships, insurance, warranties, response-time promise.
- **Schema:** the most specific `LocalBusiness` subtype (`Plumber`, `Electrician`, `HousePainter`, `MovingCompany`…), `Service` per service page.
- **SEO angle:** "service + city" and "problem + city" clusters; Google Business Profile consistency; unique project/locality content instead of cloned city pages.
- **Mistakes:** hiding the phone number; generic stock photos; no prices at all; a form with ten fields.

## 2. Health, wellness and beauty
- **Visitor's question:** "Will you fix my problem, is it safe, who will treat me, can I book easily, is it covered or affordable?"
- **Primary conversion:** online booking or intake request; calls for older audiences.
- **Pages:** home, treatments/complaints (one page per complaint or treatment, written around the patient's problem), practitioners (photos, qualifications), prices and insurance/reimbursement, first-visit guide ("what to expect"), locations and hours, contact/booking, FAQ.
- **Sections:** symptom-led entry ("Where does it hurt?" chips that lead to the right page or form step); calm, warm photography of the real practice; practitioner cards; reimbursement/price table; reviews; first-visit timeline.
- **Trust:** registrations and memberships, real practitioners with credentials, clear privacy handling, accessibility of the premises.
- **Schema:** `MedicalClinic`, `Dentist`, `Physician`, `HealthAndBeautyBusiness`, `DaySpa`, `ExerciseGym`; practitioner `Person` with credentials where appropriate.
- **SEO angle:** complaint + treatment + location; careful, accurate health content (E-E-A-T matters a lot for health topics).
- **Mistakes:** promising outcomes (health claims are regulated in many countries); before/after imagery that breaks rules; stock models instead of the real team; an intake form that asks for medical details before establishing trust (collect sensitive data only where necessary and secured).

## 3. Professional services
- **Visitor's question:** "Do you understand my situation, are you competent and trustworthy, what will it cost, how do we start?"
- **Primary conversion:** consultation request or call booking; downloadable guide for early-stage visitors.
- **Pages:** home, practice areas/services (one each), sectors/audiences served, team (individual profiles), case results or client stories, insights/articles, pricing approach, contact.
- **Sections:** "Who we help" segmentation; process and fee transparency (fixed fees, hourly ranges or "first call free"); credentials and memberships; client logos where permitted; author-bylined insights.
- **Trust:** named experts with photos and credentials, publications, testimonials (within professional rules), clear terms.
- **Schema:** `LegalService`, `AccountingService`, `ProfessionalService`, `Person` for team members, `Article` for insights.
- **SEO angle:** problem- and situation-based queries ("divorce with a business", "VAT for freelancers"), expert articles that earn links.
- **Mistakes:** corporate jargon; stock handshakes; hiding fees completely; one generic "services" page.

## 4. SaaS, apps and digital products
- **Visitor's question:** "What does it do for me, is it better than what I use, how hard is it to switch, what does it cost?"
- **Primary conversion:** start free trial or sign up; book a demo for sales-led products; app store download on mobile.
- **Pages:** home, product/features (by job-to-be-done), solutions per audience or use case, pricing, integrations, customers/case studies, changelog, docs/help, security, about, contact sales.
- **Sections:** product UI as the hero visual (real screenshots or crisp UI fragments, not abstract blobs); logo wall; bento of capabilities; "how it works" in three steps; comparison against the status quo; pricing with a recommended plan and a feature table; security and compliance badges; final CTA.
- **Trust:** customer logos and quantified case studies, uptime/status, security pages, changelog showing momentum.
- **Schema:** `SoftwareApplication` (with offers), `Organization`, `FAQPage` content optional (no rich result anymore).
- **SEO angle:** problem/use-case pages, "X alternative" and "X vs Y" comparisons, integration pages, templates/tools as link magnets.
- **Mistakes:** vague hero copy ("the future of work"); feature lists without outcomes; pricing hidden behind "contact us" when self-serve is possible.

## 5. Agencies, studios and freelancers (portfolio)
- **Visitor's question:** "Is your work good and relevant to me, what's it like to work with you, can you do my project in my budget and time?"
- **Primary conversion:** project enquiry (qualify with project type, budget range, timeline), or a call booking.
- **Pages:** home, work (filterable case studies), individual case studies, services/capabilities, about/team/culture, process, contact; careers if hiring.
- **Sections:** work-first hero (one striking project or a reel with a poster frame), case studies structured as challenge → approach → result with numbers, client logos, process, team portraits, enquiry form with budget ranges.
- **Trust:** results, awards, named clients, testimonials from people with titles.
- **Schema:** `Organization` or `ProfessionalService`, `CreativeWork` for case studies, `Person` for freelancers.
- **SEO angle:** service + industry ("branding agency for restaurants"), location for local agencies, case studies around clients' problems.
- **Mistakes:** style over substance; case studies without results; huge unoptimised images and videos; no indication of budget level.

## 6. Hospitality
- **Visitor's question:** "What's it like, what's on the menu or what are the rooms, is it open/available when I want, how do I book or get there?"
- **Primary conversion:** reservation or booking; calls and directions on mobile.
- **Pages:** home, menu (as real HTML text, never only a PDF), reservations, rooms/offers (hotels), events and private dining, gallery, about/story, location and hours, contact, gift cards.
- **Sections:** atmospheric photography or a short ambient video; opening hours and "open now" status; menu highlights with prices; booking widget loaded on click; location with transport and parking; reviews.
- **Schema:** `Restaurant`/`CafeOrCoffeeShop`/`BarOrPub` (with `servesCuisine`, `menu`, `acceptsReservations`, opening hours), `Hotel`/`LodgingBusiness`, `Event` for public, bookable physical events.
- **SEO angle:** cuisine + area, occasion queries ("private dining amsterdam"), up-to-date hours.
- **Mistakes:** PDF-only menus; heavy booking widgets on every page; out-of-date hours.

## 7. Real estate and property
- **Visitor's question:** "What's available that fits me, what's it worth, who will help me, can I trust them?"
- **Primary conversion:** viewing request, valuation request, or listing alerts sign-up.
- **Pages:** home, listings with search and filters, listing detail, valuation tool, services (buy/sell/rent), areas guides, team, reviews, contact.
- **Sections:** search-first hero (location + type + budget), listing cards with key facts, valuation lead magnet ("What's my home worth?" as a conversational form), area guides, agent profiles.
- **Schema:** `RealEstateAgent`, listings as `Offer`/`Product`-style data only where it matches guidelines; `Place` for areas.
- **SEO angle:** area + property type, area guides, valuation queries.
- **Mistakes:** slow image-heavy listing grids; filters that create crawlable duplicate URLs (see seo.md on faceted navigation).

## 8. Events, conferences and courses
- **Visitor's question:** "What will I get, who's speaking or teaching, when and where, what does it cost, is it worth it?"
- **Primary conversion:** ticket purchase or registration; waitlist when sold out.
- **Pages:** home (date, place, CTA above the fold), programme/curriculum, speakers/teachers, tickets/pricing, venue/travel, sponsors, FAQ, past editions.
- **Sections:** countdown only if it's genuinely useful (real dates), agenda by day, speaker grid with photos, ticket tiers with deadlines, testimonials and photos from past editions.
- **Schema:** `Event` (physical, publicly bookable) with offers, location and performers; `Course` for courses.
- **Mistakes:** date and location buried; fake scarcity; agendas only as images.

## 9. Personal brands, coaches and creators
- **Visitor's question:** "Who is this person, can they help someone like me, what do others say, what's the first step?"
- **Primary conversion:** discovery call booking, application form, newsletter sign-up, or product purchase.
- **Pages:** home, about/story, offers (coaching, courses, speaking), testimonials, content (articles, podcast, videos), newsletter, contact/booking.
- **Sections:** a strong portrait and a clear promise; "who it's for / not for"; programme outline; transformation stories; lead magnet; media logos.
- **Schema:** `Person` (with `sameAs` links), `Organization` if there's a company, `Course`/`Service` for offers.
- **Mistakes:** vague promises; walls of text; no clear first step.

## 10. B2B industrial and manufacturing
- **Visitor's question:** "Can you make or supply exactly what I need, at our spec, volume and quality, reliably?"
- **Primary conversion:** request a quote with specifications (file upload for drawings), contact a specialist, download a datasheet.
- **Pages:** home, capabilities, industries, products or product families with specs, quality and certifications, case studies, about/facility, careers, contact/RFQ.
- **Sections:** capability matrix, specification tables (real HTML tables), certifications (ISO…), facility photos and machine park, industries served, RFQ form with file upload (store uploads in R2).
- **Schema:** `Organization`, `Product` for catalogue items where appropriate.
- **SEO angle:** technical specification queries, materials and processes, industry + capability.
- **Mistakes:** brochure-speak without specs; PDFs as the only source of information; no direct contact person.

## 11. Non-profits and associations
- **Visitor's question:** "What do you do, does it make a difference, how can I help or get help?"
- **Primary conversion:** donate, volunteer, become a member, or find help, depending on the audience; often two audiences need two clear paths.
- **Pages:** home, mission/impact, programmes, get help, get involved (donate, volunteer, membership), news/stories, transparency (reports, financials), contact.
- **Sections:** impact numbers with sources, stories of real people (with consent), clear donate path with suggested amounts, accountability information.
- **Schema:** `NGO` / `Organization`, `DonateAction` where applicable, `Event` for public events.
- **Mistakes:** guilt-heavy imagery; unclear use of funds; burying "get help" for the people who need it.

## 12. Campaign landing pages
For ads, launches and lead magnets, a landing page is a single-purpose page: one offer, one action.
- **Message match:** the headline repeats the promise of the ad or email that brought people here.
- **No escape hatches:** minimal or no navigation, one CTA (repeated), no unrelated links.
- **Above the fold:** headline, one-line value, the form's first step or the CTA, and a proof element.
- **Below:** benefits, how it works, proof, objections (FAQ), the CTA again.
- **Speed:** prerendered; the ad click must not wait.
- **Measurement:** UTM parameters preserved into the lead record (hidden fields), conversion event on submit, `noindex` if the page duplicates an indexed page or is temporary.

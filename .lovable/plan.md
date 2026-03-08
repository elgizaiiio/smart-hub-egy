

# تحويل Terms و Privacy لروابط خارجية

## التغييرات المطلوبة

### 1. حذف صفحة LegalPage
- حذف `src/pages/LegalPage.tsx`
- إزالة الـ Routes من `src/App.tsx` (`/terms` و `/privacy`)
- إزالة الـ import

### 2. تحديث كل الروابط لتشير للدومينات الخارجية

| ملف | التغيير |
|-----|---------|
| `src/components/landing/LandingFooter.tsx` | تحويل `/terms` → `https://terms.megsyai.com` و `/privacy` → `https://privacy.megsyai.com` مع `target="_blank"` |
| `src/components/CookieConsent.tsx` | تحويل `<Link to="/privacy">` → `<a href="https://privacy.megsyai.com" target="_blank">` |
| `src/pages/AuthPage.tsx` | تحويل `navigate("/terms")` و `navigate("/privacy")` → `window.open()` للدومينات الخارجية |

---

## بالنسبة لمحتوى الصفحات القانونية

هذه prompts جاهزة تستخدمها لإنشاء المحتوى على المواقع الخارجية:

### Prompt لـ Terms of Service:

```text
Write a comprehensive, legally compliant Terms of Service for "Megsy AI" (megsyai.com), an AI-powered SaaS platform based in Egypt offering: AI chat, image generation, video generation, code generation, and file management. The platform uses a credit-based billing system with subscription plans (Free, Pro, Business). Include all sections required by Egyptian law (Consumer Protection Law No. 181/2018, E-Commerce Law, Electronic Signature Law No. 15/2004), EU GDPR (for international users), US CAN-SPAM, and CCPA compliance. 

Must include these sections:
1. Definitions & Interpretation
2. Acceptance of Terms & Eligibility (minimum age 13, 16 for EU)
3. Account Registration & Security
4. Description of Services (AI chat, image/video/code generation, file storage)
5. Credit System & Billing (non-refundable credits, auto-renewal, subscription terms)
6. Refund Policy (per Egyptian Consumer Protection Law)
7. User Content & Intellectual Property (user retains rights, AI-generated content license)
8. AI-Generated Content Disclaimer (no guarantees of accuracy, no liability for misuse)
9. Prohibited Uses (illegal content, reverse engineering, abuse, CSAM, deepfakes)
10. Third-Party Services & APIs (Supabase, AI model providers)
11. Privacy & Data Protection (reference to Privacy Policy)
12. DMCA / Copyright Takedown Procedure
13. Limitation of Liability & Disclaimer of Warranties
14. Indemnification
15. Governing Law & Jurisdiction (Egyptian courts, Cairo)
16. Dispute Resolution & Arbitration
17. Modification of Terms (30-day notice)
18. Termination & Suspension
19. Force Majeure
20. Severability
21. Entire Agreement
22. Contact Information (support@megsyai.com)

Write in formal legal English. Last updated: March 2026. Company jurisdiction: Arab Republic of Egypt.
```

### Prompt لـ Privacy Policy:

```text
Write a comprehensive, legally compliant Privacy Policy for "Megsy AI" (megsyai.com), an AI-powered SaaS platform based in Egypt. The platform collects user data for AI chat, image/video/code generation, and file management services. Uses Supabase for authentication and database, processes payments via Stripe. Must comply with: Egyptian Personal Data Protection Law (PDPL) No. 151/2020, EU GDPR, US CCPA/CPRA, UK Data Protection Act 2018, Brazilian LGPD, and ePrivacy Directive (cookies).

Must include these sections:
1. Introduction & Data Controller Information (Megsy AI, Egypt, contact: privacy@megsyai.com)
2. Data We Collect:
   - Personal data (name, email, phone, payment info)
   - Usage data (IP, browser, device, pages visited)
   - AI interaction data (prompts, generated content)
   - Files uploaded by users
   - Cookies & tracking technologies
3. Legal Basis for Processing (consent, contract, legitimate interest, legal obligation)
4. How We Use Your Data (service delivery, billing, security, improvement, analytics, communications)
5. AI-Specific Data Practices:
   - How prompts and generated content are processed
   - Whether data is used for model training (NO - state clearly)
   - Data retention for AI interactions
6. Data Sharing & Third Parties:
   - Supabase (database/auth)
   - AI model providers (OpenAI, Anthropic, Google, etc.)
   - Payment processors (Stripe)
   - Analytics providers
   - Law enforcement (when legally required)
7. International Data Transfers (Standard Contractual Clauses, adequacy decisions)
8. Data Retention Periods (specific timeframes for each data category)
9. Your Rights:
   - GDPR rights (access, rectification, erasure, portability, restriction, objection)
   - CCPA rights (know, delete, opt-out of sale, non-discrimination)
   - Egyptian PDPL rights
10. Children's Privacy (under 13/16 not permitted)
11. Cookie Policy (types, purposes, how to manage, consent mechanism)
12. Data Security Measures (encryption, RLS, access controls)
13. Data Breach Notification Procedure (72-hour GDPR requirement)
14. Changes to This Policy (30-day notice, email notification)
15. DPO / Contact Information
16. Governing Law (Egyptian law, with international compliance)
17. Complaint to Supervisory Authority (Egyptian Data Protection Center, EU DPAs)

Write in clear, formal English. Last updated: March 2026. Include a summary table at the top for transparency. Company jurisdiction: Arab Republic of Egypt.
```

---

هذه الـ prompts تغطي القوانين التالية:
- **مصر**: قانون حماية البيانات الشخصية 151/2020، قانون حماية المستهلك 181/2018، قانون التوقيع الإلكتروني 15/2004
- **أوروبا**: GDPR + ePrivacy
- **أمريكا**: CCPA/CPRA + CAN-SPAM + COPPA
- **بريطانيا**: UK DPA 2018
- **البرازيل**: LGPD


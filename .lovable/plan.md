

# تغيير كل النصوص الخضراء (text-primary) إلى ذهبي في صفحة Referrals

## التغييرات في `src/pages/ReferralsPage.tsx`

| السطر | الحالي | الجديد |
|-------|--------|--------|
| 124 | `text-primary` | `style={{ color: "#FFD700" }}` |
| 173 | `bg-primary/10` + `text-primary` | `bg-[#FFD700]/10` + `text-[#FFD700]` |
| 215 | `text-primary` + inline style شرطي | `style={{ color: "#FFD700" }}` دائماً |
| 251 | `text-primary` + inline style شرطي | `style={{ color: "#FFD700" }}` لغير rejected |

**ملاحظة:** زر النسخ (`bg-primary`) سيبقى كما هو لأنه زر وليس نص.


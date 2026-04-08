

# خطة إصلاح 28 خطأ متبقي من تقرير E2E

## الأخطاء المستخرجة (28 خطأ غير مُصلح)

```text
الأولوية   العدد   الحالة
─────────────────────────
P0 حرج      3      لم يُصلح
P1 عالي      6      لم يُصلح
P2 متوسط    13      لم يُصلح
P3 منخفض     6      لم يُصلح
```

---

## المرحلة 1: الأخطاء الحرجة (P0) — 3 أخطاء

| الخطأ | الوصف | الإصلاح |
|-------|-------|---------|
| BUG-12 | Computer Use يتوقف عند حظر كل مفاتيح HB | إضافة آلية إعادة تفعيل تلقائية بعد 30 دقيقة + تنبيه عبر console |
| BUG-13 | Slides تولد HTML بدل Canva/PPTX | ربط Computer Use بـ Canva — إرسال task لـ HyperAgent يفتح canva.com وينشئ ويصدر PPTX |
| BUG-18 | المكالمات الصوتية تفشل بدون Deepgram token | التحقق من وجود المفتاح قبل بدء المكالمة + رسالة خطأ واضحة |

---

## المرحلة 2: الأخطاء العالية (P1) — 6 أخطاء

| الخطأ | الوصف | الإصلاح |
|-------|-------|---------|
| BUG-04 | ChatPage.tsx = 1038 سطر | تقسيم إلى: ChatMessages, ChatInput, ChatDialogs, ChatSidebar |
| BUG-09 | خطأ 402 يظهر رسالة تقنية | عرض "الرصيد غير كافٍ" بدل النص التقني |
| BUG-11 | لا fallback من LemonData لـ deAPI عند 402 | إضافة catch 402 → تحويل تلقائي لـ deAPI |
| BUG-15 | DOCX يُقرأ كـ binary garbage | استخدام mammoth.js لتحويل DOCX لنص |
| BUG-22 | بطء أول رد AI | تقليل system prompt للرسائل البسيطة + تسريع isCasualMessage |
| BUG-25 | CORS مفتوح `*` في كل Edge Functions | تقييد لـ `smart-hub-egy.lovable.app` و `lovable.app` |

---

## المرحلة 3: الأخطاء المتوسطة (P2) — 13 خطأ

| الخطأ | الإصلاح المختصر |
|-------|----------------|
| BUG-01 | إضافة regex validation للبريد في AuthPage |
| BUG-05 | إضافة `React.memo` على ChatMessage |
| BUG-06 | إضافة `isSubmitting` ref لمنع double-submit |
| BUG-07 | مسح statusHistory عند تبديل المحادثة |
| BUG-10 | إضافة تحقق حجم الملف (max 20MB) في ToolPageLayout |
| BUG-14 | إضافة AbortController لإلغاء Computer Use |
| BUG-20 | إضافة خصم credits بعد كل مكالمة صوتية |
| BUG-23 | تثبيت react-virtuoso لقائمة الرسائل |
| BUG-26 | إضافة `dir="rtl"` تلقائي بناءً على اللغة |
| BUG-28 | إضافة Supabase Realtime subscription للمحادثة النشطة |
| BUG-29 | طلب كلمة مرور تأكيدية قبل حذف الحساب |
| BUG-32 | حل memory leak عبر react-virtuoso (مع BUG-23) |
| BUG-34 | نفس BUG-20 (مكرر) |

---

## المرحلة 4: الأخطاء المنخفضة (P3) — 6 أخطاء

| الخطأ | الإصلاح المختصر |
|-------|----------------|
| BUG-08 | إضافة `useDeferredValue` في AnimatedInput |
| BUG-16 | تحديد max 5 ملفات مرفقة |
| BUG-17 | رفض الملفات الفارغة (size === 0) |
| BUG-27 | دعم `/chat?conv=xxx` عبر useSearchParams |
| BUG-30 | إضافة try/catch حول كل عمليات localStorage |
| BUG-31 | إضافة reconnect logic لـ Supabase Realtime |

---

## الملفات المتأثرة

```text
المرحلة 1 (P0):
  supabase/functions/computer-use/index.ts    — إعادة تفعيل مفاتيح + Canva task
  supabase/functions/chat/index.ts            — slides عبر computer-use
  src/pages/voice/VoiceCallPage.tsx           — فحص Deepgram قبل البدء

المرحلة 2 (P1):
  src/pages/ChatPage.tsx                      — تقسيم لـ 4 مكونات
  src/components/chat/ChatMessages.tsx         — جديد
  src/components/chat/ChatInput.tsx            — جديد
  src/components/chat/ChatDialogs.tsx          — جديد
  supabase/functions/generate-image/index.ts   — fallback 402
  supabase/functions/chat/index.ts             — رسالة 402 واضحة + CORS
  src/pages/FilesPage.tsx                      — mammoth.js لـ DOCX
  كل Edge Functions                           — CORS تقييد

المرحلة 3 (P2):
  src/pages/AuthPage.tsx                       — email validation
  src/components/ChatMessage.tsx               — React.memo
  src/components/ThinkingLoader.tsx            — مسح statusHistory
  src/components/ToolPageLayout.tsx            — تحقق حجم الملف
  src/pages/voice/VoiceCallPage.tsx            — credits deduction
  src/pages/settings/DeleteAccountPage.tsx     — تأكيد بكلمة مرور

المرحلة 4 (P3):
  src/components/AnimatedInput.tsx             — useDeferredValue
  src/pages/FilesPage.tsx                      — حد ملفات + فارغ
  src/pages/ChatPage.tsx                       — deep linking
  src/hooks/useLocalCache.ts                   — try/catch
```

## ترتيب التنفيذ

1. المرحلة 1 (P0) — الأخطاء الحرجة اولا
2. المرحلة 2 (P1) — تقسيم ChatPage + fallback + CORS
3. المرحلة 3 (P2) — تحسينات الاداء والامان
4. المرحلة 4 (P3) — تحسينات صغيرة


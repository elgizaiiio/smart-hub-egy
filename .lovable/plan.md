

## المشكلة

أحداث اللمس (`onTouchStart` / `onTouchEnd`) على كل رسالة assistant تعترض التمرير على الموبايل لأنها تُفعّل مؤقت الضغط المطوّل. أيضاً عند ظهور قائمة الإجراءات (`showActions`) يظهر `div` بـ `fixed inset-0` يغطي الشاشة بالكامل ويمنع التمرير.

## الحل

### `src/components/ChatMessage.tsx`

1. **إزالة أحداث اللمس** (`onTouchStart`, `onTouchEnd`) من حاوية الرسالة بالكامل — هذه هي السبب الرئيسي لمنع التمرير على الموبايل.

2. **إزالة أحداث الماوس** (`onMouseDown`, `onMouseUp`, `onMouseLeave`) أيضاً لأن أزرار الإجراءات (نسخ، إعجاب، عدم إعجاب) تظهر دائماً أسفل كل رسالة، فلا حاجة لقائمة الضغط المطوّل.

3. **حذف كود `showActions`** بالكامل (الـ overlay + القائمة المنبثقة) — لم يعد مطلوباً لأن الأزرار موجودة دائماً.

4. **حذف** `longPressTimer` ref و `showActions` state و `handleLongPressStart` و `handleLongPressEnd`.

النتيجة: الرسالة تصبح `div` عادي بدون أي event handlers على اللمس، فيعمل التمرير بحرية تامة.


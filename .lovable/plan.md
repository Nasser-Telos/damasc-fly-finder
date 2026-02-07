

# تحسين الهيدر - إزالة الطائرة المتحركة وإضافة لمسات احترافية هادئة

## المشكلة
الطائرة المتحركة العابرة مشتتة للانتباه ولا تضيف قيمة. نريد استبدالها بتأثيرات أنيقة وهادئة تعطي إحساساً بالاحترافية بدون تشتيت.

## الحل: ثلاث لمسات احترافية هادئة

### 1. تأثير بريق/لمعان على الشعار (Shimmer Sweep)
خط ضوئي مائل يمر عبر أيقونة الشعار كل 5 ثوانٍ - مثل انعكاس الضوء على سطح لامع. تأثير راقي وهادئ يلفت النظر بدون مبالغة.

### 2. نقاط متلألئة صغيرة في خلفية الهيدر (Sparkle Dots)
3-4 نقاط صغيرة جداً (2px) بلون أزرق شفاف تتلألأ ببطء في خلفية الهيدر. تعطي إحساس "سماء ليلية" خفيف جداً بدون إزعاج.

### 3. إبقاء تأثير الطفو والنبض الحاليين
تأثيرات `syria-logo-float` و `syria-logo-pulse` الموجودة حالياً هادئة ومناسبة، نبقيها كما هي.

---

## التفاصيل التقنية

### تعديل `src/pages/Index.tsx`

**إزالة الطائرة المتحركة (سطور 162-170):**
- حذف عنصر `<div className="syria-fly-plane">` بالكامل مع محتوياته

**إضافة نقاط متلألئة في الهيدر:**
- إضافة 3 عناصر `<div className="syria-sparkle">` داخل `.syria-hdr` بمواقع مختلفة عبر `style` (top/left متغيرة)

### تعديل `src/pages/Index.css`

**إزالة:**
- كلاس `.syria-fly-plane` وأنماطه
- كلاس `.syria-fly-trail`
- `@keyframes syria-fly`

**إضافة - تأثير الشيمر على الشعار:**

```css
.syria-logo-mark::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    115deg,
    transparent 40%,
    hsla(0 0% 100% / 0.4) 50%,
    transparent 60%
  );
  animation: syria-shimmer 5s ease-in-out infinite;
  z-index: 1;
}
```

```css
@keyframes syria-shimmer {
  0%, 100% { transform: translateX(-100%) rotate(0deg); }
  20% { transform: translateX(100%) rotate(0deg); }
  21%, 100% { transform: translateX(-100%) rotate(0deg); }
}
```

هذا يجعل خط الضوء يمر مرة واحدة كل 5 ثوانٍ ثم ينتظر.

**إضافة - النقاط المتلألئة:**

```css
.syria-sparkle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: hsla(217 91% 60% / 0.25);
  pointer-events: none;
  animation: syria-twinkle 4s ease-in-out infinite;
}
```

```css
@keyframes syria-twinkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1); }
}
```

كل نقطة لها `animation-delay` مختلف لتتلألأ بشكل متتابع وليس متزامن.

**إضافة `overflow: hidden` على `.syria-logo-mark`:**
لمنع تأثير الشيمر من الظهور خارج حدود الأيقونة.

**تعديلات responsive (360px):**
- إخفاء النقاط المتلألئة على الشاشات الصغيرة جداً

---

## ملخص التغييرات

| العنصر | التغيير | السبب |
|--------|---------|-------|
| `.syria-fly-plane` + trail + keyframe | حذف كامل | مشتت للانتباه |
| Flying plane JSX | حذف من Index.tsx | إزالة العنصر |
| `.syria-logo-mark::before` | شيمر جديد | لمعان أنيق على الشعار |
| `.syria-sparkle` | كلاس جديد | نقاط متلألئة هادئة |
| `@keyframes syria-shimmer` | جديد | حركة خط الضوء |
| `@keyframes syria-twinkle` | جديد | تلألؤ النقاط |

## الملفات المعدلة

| الملف | التغيير |
|-------|---------|
| `src/pages/Index.tsx` | إزالة الطائرة المتحركة + إضافة نقاط متلألئة |
| `src/pages/Index.css` | إزالة أنماط الطائرة + إضافة shimmer و sparkle |


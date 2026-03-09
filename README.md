# 🐄 INRA Ration Calculator - حاسبة عليقة INRA

> مساعد ذكي للمربي المغاربي لتبسيط نظام INRA French dairy cattle ration balancing system

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)

---

## 🇩🇿 🇲🇦 🇹🇳概述 (Vue d'ensemble)

This is a **smart assistant for Maghreb farmers** that simplifies the French INRA ration balancing system. Calculate optimal feed rations for dairy cows based on weight, milk production, age, and physiological status.

## ✨ المميزات (Fonctionnalités)

### حاسبة الاحتياجات الغذائية
- **UFL** (Unité Fourragère Lait) حساب الطاقة
- **PDI** (Protéines Digestibles dans l'Intestin) حساب البروتين
- دعم جميع المراحل الفسيولوجية:
  - 🐄 أبقار حلابة (Vaches laitières)
  - 💤 أبقار جافة (Vaches taries)
  - 🐂 عجلات (Génisses)
  - 🐃 عجول (Veaux)

### نظامAge Categories
| الفئة | العمر | الوصف |
|-------|-------|-------|
| عجل | 6-14 شهر | نمو العظام والعضلات |
| عجلة | 15-23 شهر | تطوير الضرع |
| بقرة بالغة | +24 شهر | إنتاج الحليب |

### لوحة العليقة
- اختيار الأعلاف المتاحة في المزرعة
- حساب المادة الجافة (MS)
- موازنة تلقائية: ±0.2 UFL, ±50g PDI
- تصدير إلى Excel

### multi-language
- 🇸🇦 العربية (العربية)
- 🇫🇷 Français
- 🇬🇧 English

---

## 🚀 الاستخدام (Utilisation)

```bash
# التثبيت
bun install

# التطوير
bun dev

# البناء للإنتاج
bun build
```

افتح [http://localhost:3000](http://localhost:3000)

---

## 📊 مثال على الحساب (Exemple de calcul)

```
بقرة: 600 كغ
إنتاج الحليب: 25 لتر/يوم
دهون الحليب: 3.8%

الاحتياجات:
- الصيانة: 5.2 UFL
- الإنتاج: 8.5 UFL
- النشاط: 0.5 UFL
= الإجمالي: 14.2 UFL / 140g PDI
```

---

## 📁 هيكل المشروع (Structure)

```
src/
├── app/
│   ├── page.tsx          # الصفحة الرئيسية
│   ├── layout.tsx        # التخطيط
│   └── globals.css       # الأنماط
├── components/
│   ├── RationCalculator.tsx  # الحاسبة
│   ├── ResultsPanel.tsx      # النتائج
│   ├── FeedRationPanel.tsx  # لوحة العليقة
│   └── CowRecordsView.tsx    # سجل الأبقار
└── lib/
    ├── inra-calculator.ts    # حساب INRA
    ├── feed-ration.ts        # موازنة العليقة
    ├── cow-records.ts        # قاعدة البيانات
    └── i18n.ts              # الترجمات
```

---

## 🔬 نظام INRA

### الوحدات
| الوحدة | الوصف |
|--------|-------|
| **UFL** | وحدة طاقة حليب فرنسية ≈ 1700 kcal |
| **PDI** | بروتين قابل للهضم في الأمعاء (غ/يوم) |

### المعادلات
```
الطاقة = 0.035 × وزن^0.75 (صيانة)
البروتين = 3.25 × وزن^0.50 (صيانة)
```

---

## 👨‍🌾 للمزارعين المغاربة

### نصائح للتغذية
1. **الأعلاف الخشنة**: جو straw, alfalfa, hay
2. **الأعلاف المركزة**: شعير, ذرة, صوجا
3. **العلافات**: يجب أن تشكل 60% من الطاقة
4. **الماء**: 80-120 لتر/يوم

### ملاحظات
- راقب وزن البقرة شهرياً
-Adjust حسب إنتاج الحليب
- استشر طبيب بيطري عند الحاجة

---

## 📄 الترخيص (Licence)

MIT License - Use at your own risk

---

## 🙏 شكرowsky

- [INRA](https://www.inrae.fr/) - المعهد الوطني للبحث الزراعي (فرنسا)
- نظام التغذية INRA 2007

---

*حاسبة العليقة - مساعدك في تغذية الأبقار*

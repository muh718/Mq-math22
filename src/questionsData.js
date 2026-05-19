// questions.js
export const MATHEMATICS_DATABASE = [];

// دالة مساعدة لتغليف الرموز الرياضية وتأكيد قراءتها من اليسار إلى اليمين (تمنع انقلاب الإشارات)
function mathF(str) {
    return `<span class="math-v" style="unicode-bidi: isolate; direction: ltr; display: inline-block;">${str}</span>`;
}

// دالة لإنشاء الكسر الرياضي العمودي ليعطي مظهر خط اليد الحقيقي
function makeHandwrittenFraction(numHTML, denHTML) {
    return `<div class="math-fraction math-handwritten" style="display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; padding: 0 4px;"><div class="math-numerator" style="border-bottom: 2px solid white; padding-bottom: 2px; text-align: center;">${numHTML}</div><div class="math-denominator" style="padding-top: 2px; text-align: center;">${denHTML}</div></div>`;
}

function gcd(a, b) { return b === 0 ? Math.abs(a) : gcd(b, a % b); }
const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
const nPr = (n, r) => Math.round(factorial(n) / factorial(n - r));
const nCr = (n, r) => Math.round(factorial(n) / (factorial(r) * factorial(n - r)));

function fmtF(n, d) {
    const pi = '<span class="pi-symbol">π</span>';
    if (d === 1) return `<span style="unicode-bidi: isolate; direction: ltr; display: inline-block;">${n}${pi}</span>`;
    return makeHandwrittenFraction(`${n === 1 ? '' : n}${pi}`, `${d}`);
}

function tR(d) {
    let common = gcd(d, 180), n = d / common, den = 180 / common;
    if (n === 1 && den === 1) return '<span class="pi-symbol">π</span>';
    return fmtF(n, den);
}

// === [ توليد أسئلة الباب الخامس ] ===
(function genCh5() {
    for (let i = 1; i <= 60; i++) {
        let c1 = (i % 6) + 2, c2 = (i % 4) + 3, p1 = (i % 2) + 3;
        let qFrac = makeHandwrittenFraction(`${c1 * c2}x<sup>${p1}</sup>`, `${c1}x<sup>2</sup>`);
        let aCorr = `<span>${c2}x<sup>${p1 - 2}</sup></span>`;
        MATHEMATICS_DATABASE.push({
            id: `M_Ch5_MD_${i}`, topic: "الباب الخامس",
            q: `بسّط العبارة النسبية التالية لأبسط صورة ممكنة: <br> ${qFrac}`,
            a: [aCorr, `<span>${c1}x<sup>${p1}</sup></span>`, `<span>${c1 * c2}x</span>`, `<span>${c2}x<sup>${p1}</sup></span>`]
        });

        let v1 = (i % 5) + 2, v2 = (i % 3) + 4;
        let lcm = (v1 * v2) / gcd(v1, v2);
        MATHEMATICS_DATABASE.push({
            id: `M_Ch5_AS_${i}`, topic: "الباب الخامس",
            q: `أوجد المضاعف المشترك الأصغر (LCM) للمقدارين وحيدي الحد: <br> <span>${v1}x<sup>3</sup>y</span> و <span>${v2}xy<sup>2</sup></span>`,
            a: [`<span>${lcm}x<sup>3</sup>y<sup>2</sup></span>`, `<span>${v1 * v2}xy</span>`, `<span>${gcd(v1, v2)}x<sup>3</sup>y<sup>2</sup></span>`, `<span>${lcm}xxl<sup>4</sup>y<sup>3</sup></span>`]
        });
    }
})();

// === [ توليد أسئلة الباب السادس ] ===
(function genCh6() {
    for (let i = 1; i <= 60; i++) {
        // متتابعات كدوال ومتتابعات حسابية - تم تعديل التنسيق لتبدو رتبة الحد لأسفل الرمز مائل كالكتابة اليدوية a_n
        let c1 = (i % 7) + 2, c2 = (i % 11) - 5, sign = c2 >= 0 ? "+" : "-", absVal = Math.abs(c2), n = (i % 4) + 2;
        let ans = c1 * n + c2;
        
        let subN = `<span style="font-style: italic; font-family: 'Amiri', serif; font-size: 1.4rem;">a<sub>${n}</sub></span>`;
        let subFormula = `<span style="font-style: italic; font-family: 'Amiri', serif; font-size: 1.4rem;">a<sub>n</sub></span>`;

        MATHEMATICS_DATABASE.push({
            id: `M_Ch6_DH_${i}`, topic: "الباب السادس",
            q: `ما قيمة الحد ${subN} في المتتابعة الممثلة بالدالة ${mathF(`${subFormula} = ${c1}n ${sign} ${absVal}`)}؟`,
            a: [mathF(`${ans}`), mathF(`${ans + c1}`), mathF(`${ans - c1}`), mathF(`${ans + 10}`)]
        });

        let d = (i % 8) + 1;
        MATHEMATICS_DATABASE.push({
            id: `M_Ch6_HL_${i}`, topic: "الباب السادس",
            q: `ما الكسر الاعتيادي المكافئ للكسر العشري الدوري ${mathF(`0.${d}${d}${d}...`)}؟`,
            a: [mathF(`${d}/9`), mathF(`${d}/10`), mathF(`1/${d + 1}`), mathF(`${d}/99`)]
        });
    }
})();

// === [ توليد أسئلة الباب السابع ] ===
(function genCh7() {
    for (let i = 1; i <= 60; i++) {
        // فضاء العينة والتباديل والتوافيق - تم تصحيح صياغة السؤال والمشتتات المكررة
        let facesOptions = [4, 6, 8, 12, 20];
        let faces = facesOptions[i % facesOptions.length]; 
        let count = (i % 2) + 2; // عدد المرات (2 أو 3)
        let res = Math.pow(faces, count);
        
        MATHEMATICS_DATABASE.push({
            id: `M_Ch7_SS_${i}`, topic: "الباب السابع",
            q: `عند رمي مجسم منتظم ذو <span class="math-v" style="color: #60a5fa; font-weight: bold;">${faces} وجوه</span> عدد ${count} مرات متتالية. ما عدد عناصر فضاء العينة الممكنة؟`,
            a: [mathF(`${res}`), mathF(`${res + 4}`), mathF(`${faces * count}`), mathF(`${Math.pow(count, faces)}`)]
        });

        let pA = 0.35 + (i % 3) * 0.05, pB = 0.15 + (i % 2) * 0.05, union = (pA + pB).toFixed(2);
        MATHEMATICS_DATABASE.push({
            id: `M_Ch7_EE_${i}`, topic: "الباب السابع",
            q: `في تجربة احتمالية، الحادثتان A و B متنافيتان. إذا كان ${mathF(`P(A) = ${pA.toFixed(2)}`)} و ${mathF(`P(B) = ${pB.toFixed(2)}`)}، فما قيمة اتحاد الحادثتين ؟`,
            a: [mathF(`${union}`), mathF(`${(pA * pB).toFixed(2)}`), mathF(`1.00`), mathF(`${Math.abs(pA - pB).toFixed(2)}`)]
        });
    }
})();

// === [ توليد أسئلة الباب الثامن ] ===
(function genCh8() {
    for (let i = 1; i <= 60; i++) {
        let d = (i * 3) + 15;
        MATHEMATICS_DATABASE.push({
            id: `M_Ch8_R_${i}`, topic: "الباب الثامن",
            q: `حوّل الزاوية ${mathF(`${d}°`)} إلى الراديان:`,
            a: [tR(d), tR(d + 15), tR(Math.abs(d - 10) || 20), mathF(`${d}°`)]
        });

        let b = (i % 5) + 2, per = (360 / b).toFixed(0);
        MATHEMATICS_DATABASE.push({
            id: `M_Ch8_F_${i}`, topic: "الباب الثامن",
            q: `طول دورة الدالة ${mathF(`y = cos(${b}θ)`)} هو:`,
            a: [mathF(`${per}°`), mathF(`${(180 / b).toFixed(0)}°`), mathF(`360°`), mathF(`${(720 / b).toFixed(0)}°`)]
        });
    }
})();
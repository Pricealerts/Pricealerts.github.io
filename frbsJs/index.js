

function checkLocalStorageSpace() {
    let total = 0;
    for (let x in localStorage) {
        // نتحقق من أن المفتاح يخص localStorage وليس دالة داخلية
        if (!localStorage.hasOwnProperty(x)) continue;
        console.log(x);
		
        // حساب عدد الأحرف (كل حرف في UTF-16 يشغل 2 بايت)
        total += ((localStorage[x].length + x.length) * 2);
    }
    
    const usedMB = (total / (1024 * 1024)).toFixed(2);
    console.log("المساحة المستخدمة: " + usedMB + " MB");
    
    // السعة التقريبية لمعظم المتصفحات هي 5MB
    const limitMB = 5; 
    console.log("المساحة المتبقية تقريباً: " + (limitMB - usedMB).toFixed(2) + " MB");
}

//checkLocalStorageSpace();
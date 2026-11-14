function cpAdr() {
	let rslt = gebi("adrs");
	rslt.select();
	rslt.setSelectionRange(0, 9999);
	navigator.clipboard.writeText(rslt.value);
	gebi("isCpd").classList.add("opoacity");
	setTimeout(() => {
		gebi("isCpd").classList.remove("opoacity");
	}, 3000);
}
function gebi(pr) {
	return document.getElementById(pr);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_STATE } from './seedData';
import {
  computeProfitSummary,
  getLowStockItems,
  processVoiceTranscript,
} from './kiranaReducer';
import { pickBestTranscriptAlternative } from './voiceParser';
import {
  resolveEffectiveOutputLang,
  selectOfflineHumanVoice,
} from './speechService';
import { localizeVoiceResponse } from './voiceLocalizer';
import { isConfiguredApiKey } from './apiKeyUtils';

test('Step 1: Stock-In updates Sugar drum to 25 kg with wholesale 41 and selling 46', () => {
  const result = processVoiceTranscript(
    INITIAL_STATE,
    'Poured 25 kg sugar in drum, wholesale 41, selling 46'
  );
  const sugar = result.state.items.find((i) => i.id === 'sugar');
  assert.ok(sugar);
  assert.equal(sugar.stockQty, 25);
  assert.equal(sugar.wholesalePrice, 41);
  assert.equal(sugar.sellingPrice, 46);
  assert.match(result.spokenResponse, /Sugar drum updated to 25 kilos, wholesale 41, selling 46/i);
});

test('Step 1: Edit Toor Dal rate to 135 and add new item Ragi flour', () => {
  const r1 = processVoiceTranscript(INITIAL_STATE, 'Edit toor dal rate to 135');
  const dal = r1.state.items.find((i) => i.id === 'toor-dal');
  assert.equal(dal?.sellingPrice, 135);

  const r2 = processVoiceTranscript(
    r1.state,
    'Add new item Ragi flour, 20 kilos at 55 rupees per kilo'
  );
  const ragi = r2.state.items.find((i) => i.name.toLowerCase() === 'ragi flour');
  assert.ok(ragi);
  assert.equal(ragi.stockQty, 20);
  assert.equal(ragi.sellingPrice, 55);
  assert.equal(ragi.unit, 'kg');
});

test('Step 2: Rush-hour billing converts ₹20 pallilu to 167g, deducts 1.5% tarugu, bills ₹319 to Ramesh Udhaar, warns low Toor Dal', () => {
  const sugarBefore = INITIAL_STATE.items.find((i) => i.id === 'sugar')!.stockQty;
  const groundnutsBefore = INITIAL_STATE.items.find((i) => i.id === 'groundnuts')!.stockQty;
  const rameshBefore = INITIAL_STATE.udhaarAccounts.find((a) => a.id === 'ramesh')!.balance;

  const res = processVoiceTranscript(
    INITIAL_STATE,
    'Ara kilo sugar, rendu oil packets, 20 rupees pallilu, add to Ramesh account, Bill done'
  );

  // Bill should reset hands-free after completion
  assert.equal(res.state.activeBill.length, 0);

  // Ramesh balance increased by exact ₹319 (23 + 276 + 20)
  const rameshAfter = res.state.udhaarAccounts.find((a) => a.id === 'ramesh')!;
  assert.equal(rameshAfter.balance - rameshBefore, 319);
  assert.equal(rameshAfter.balance, 850);

  // Sugar deducted 0.5kg + 1.5% tarugu (0.5075 kg)
  const sugarAfter = res.state.items.find((i) => i.id === 'sugar')!.stockQty;
  assert.equal(Math.round((sugarBefore - sugarAfter) * 10000) / 10000, 0.5075);

  // Groundnuts deducted 0.167kg + 1.5% tarugu (0.1695 kg)
  const groundnutsAfter = res.state.items.find((i) => i.id === 'groundnuts')!.stockQty;
  assert.ok(groundnutsBefore - groundnutsAfter > 0.167);

  // Low-stock warning for Toor Dal (3 kg left <= 15% of 25kg)
  assert.match(res.spokenResponse, /319 rupees added to Ramesh account/i);
  assert.match(res.spokenResponse, /Toor Dal only 3 kilos left/i);
  assert.match(res.spokenResponse, /Ready for next customer/i);

  const lowStock = getLowStockItems(res.state.items);
  assert.ok(lowStock.some((i) => i.id === 'toor-dal'));
});

test('Step 3: Missing customer demand (Brown Rice) & Ramesh ₹200 cash repayment -> ₹650 remaining', () => {
  // First run Step 2 so Ramesh balance is ₹850
  const afterBill = processVoiceTranscript(
    INITIAL_STATE,
    'Ara kilo sugar, rendu oil packets, 20 rupees pallilu, add to Ramesh account, Bill done'
  ).state;

  const res = processVoiceTranscript(
    afterBill,
    'Customer asked for Brown Rice, add to supply list. Ramesh paid 200 rupees cash'
  );

  assert.ok(res.state.missingDemand.some((m) => m.name.toLowerCase() === 'brown rice'));
  const ramesh = res.state.udhaarAccounts.find((a) => a.id === 'ramesh')!;
  assert.equal(ramesh.balance, 650);
  assert.match(res.spokenResponse, /Brown Rice added to supply list/i);
  assert.match(res.spokenResponse, /Ramesh remaining Udhaar is 650 rupees/i);
});

test('Step 4: Daily spends (1,450 milk van + 220 Mandi auto = 1,670) & AI Profit Briefing', () => {
  const res = processVoiceTranscript(
    INITIAL_STATE,
    "Paid 1,450 to milk van, 220 Mandi auto. Eeroju labham entha? What is today's profit?"
  );

  const summary = computeProfitSummary(res.state);
  assert.equal(summary.totalSales, 7420);
  assert.equal(summary.totalSpends, 1670);
  assert.equal(summary.netProfit, 1940);
  assert.equal(summary.topProfitItem?.id, 'toor-dal');
  assert.equal(summary.topProfitItem?.todayNetProfit, 409);
  assert.equal(summary.mostSoldItem?.id, 'sugar');
  assert.match(res.spokenResponse, /Sales 7,420 rupees, spends 1,670 rupees, net profit 1,940 rupees/i);
  assert.match(res.spokenResponse, /Top profit item: Toor Dal at 409 rupees/i);
});

test('Edge cases: Mid-sentence self-correction (vaddu), rhyming disambiguation, and noise filtering', () => {
  // 1. Mid-sentence correction
  const corr = processVoiceTranscript(
    INITIAL_STATE,
    'Rendu kg sugar—vaddu, make it moodu kg sugar'
  );
  assert.equal(corr.state.activeBill.length, 1);
  assert.equal(corr.state.activeBill[0].quantity, 3);
  assert.match(corr.spokenResponse, /Updated sugar to 3 kilos/i);

  // 2. Rhyming / low confidence disambiguation pauses stock deduction
  const disambig = processVoiceTranscript(INITIAL_STATE, '2 kilos salt', { confidence: 0.68 });
  assert.equal(disambig.state.lastVoiceStatus, 'disambiguate');
  assert.ok(disambig.state.pendingDisambiguation);
  assert.equal(disambig.state.activeBill.length, 0);
  assert.match(disambig.spokenResponse, /Did you mean 2 kilos sugar or 2 kilos salt\? Say yes for sugar/i);

  // Saying "yes" resolves and adds 2 kg Sugar
  const resolved = processVoiceTranscript(disambig.state, 'yes');
  assert.equal(resolved.state.pendingDisambiguation, null);
  assert.equal(resolved.state.activeBill.length, 1);
  assert.equal(resolved.state.activeBill[0].itemId, 'sugar');
  assert.equal(resolved.state.activeBill[0].quantity, 2);

  // 3. Street noise ignored without mutating state
  const noisy = processVoiceTranscript(
    INITIAL_STATE,
    'Auto horn, brother park outside near the tea stall'
  );
  assert.equal(noisy.command.type, 'noise');
  assert.equal(noisy.state.activeBill.length, 0);
  assert.equal(noisy.state.dailySpends.length, 0);
});

test('Automatic language detection identifies Telugu, Hindi, and Indian English code-mix without manual tabs', () => {
  const teRes = processVoiceTranscript(
    INITIAL_STATE,
    'Ara kilo sugar, rendu oil packets, 20 rupees pallilu'
  );
  assert.equal(teRes.state.voiceLang, 'te-IN');

  const hiRes = processVoiceTranscript(INITIAL_STATE, 'Adha kilo cheeni, paanch packet oil');
  assert.equal(hiRes.state.voiceLang, 'hi-IN');

  const enRes = processVoiceTranscript(INITIAL_STATE, 'Poured 25 kg sugar in drum, wholesale 41');
  assert.equal(enRes.state.voiceLang, 'en-IN');
});

test('Voice intake clarity repairs Indian-accented ASR mishearings, picks best alternative, and emits structured tokens', () => {
  // Common ASR mishearings: "are a kilo", "render", "palli loo"
  const phoneticRes = processVoiceTranscript(
    INITIAL_STATE,
    'are a kilo sugar, render oil packets, 20 rupees palli loo'
  );
  assert.equal(phoneticRes.state.activeBill.length, 3);
  assert.equal(phoneticRes.state.activeBill[0].quantity, 0.5);
  assert.equal(phoneticRes.state.activeBill[1].quantity, 2);
  assert.equal(phoneticRes.state.activeBill[2].displayQty, '167g');
  assert.equal(phoneticRes.state.lastVoiceClarity?.wasPhoneticRepaired, true);
  assert.ok(
    phoneticRes.state.lastVoiceClarity?.understoodTokens.some((t) => /Sugar · 500g/i.test(t))
  );

  // Multi-alternative picker selects valid Kirana alternative over generic noise
  const picked = pickBestTranscriptAlternative(
    [
      { transcript: 'hello render', confidence: 0.72 },
      { transcript: 'rendu kg sugar', confidence: 0.81 },
    ],
    INITIAL_STATE.items,
    INITIAL_STATE.udhaarAccounts
  );
  assert.equal(picked.transcript, 'rendu kg sugar');
});

test('Profile output voice settings route output language override and pick natural Male/Female voices', () => {
  // Auto follows detected input language; explicit Profile output language overrides it
  assert.equal(resolveEffectiveOutputLang('auto', 'te-IN'), 'te-IN');
  assert.equal(resolveEffectiveOutputLang('hi-IN', 'te-IN'), 'hi-IN');
  assert.equal(resolveEffectiveOutputLang('ta-IN', 'en-IN'), 'ta-IN');

  const mockVoices = [
    { name: 'eSpeak Robotic English', lang: 'en-IN' },
    { name: 'Microsoft Neerja Online (Natural) - English (India)', lang: 'en-IN' },
    { name: 'Microsoft Prabhat Online (Natural) - English (India)', lang: 'en-IN' },
    { name: 'Microsoft Shruti Online (Natural) - Telugu (India)', lang: 'te-IN' },
    { name: 'Microsoft Mohan Online (Natural) - Telugu (India)', lang: 'te-IN' },
  ];

  const femaleTe = selectOfflineHumanVoice(mockVoices, 'te-IN', 'female');
  assert.equal(femaleTe?.name, 'Microsoft Shruti Online (Natural) - Telugu (India)');

  const maleTe = selectOfflineHumanVoice(mockVoices, 'te-IN', 'male');
  assert.equal(maleTe?.name, 'Microsoft Mohan Online (Natural) - Telugu (India)');

  const maleEn = selectOfflineHumanVoice(mockVoices, 'en-IN', 'male');
  assert.equal(maleEn?.name, 'Microsoft Prabhat Online (Natural) - English (India)');
});

test('Voice Checkout finalizes bills inline ("...checkout") and standalone ("checkout", "UPI checkout")', () => {
  // 1. Inline checkout with Udhaar customer
  const inlineRes = processVoiceTranscript(
    INITIAL_STATE,
    'Ara kilo sugar, rendu oil packets, 20 rupees pallilu, add to Ramesh account, checkout'
  );
  assert.equal(inlineRes.state.activeBill.length, 0);
  assert.equal(inlineRes.state.salesHistory[0]?.totalAmount, 319);
  assert.equal(inlineRes.state.salesHistory[0]?.paymentMethod, 'udhaar');
  assert.equal(inlineRes.state.lastBillSummary?.total, 319);
  assert.equal(inlineRes.state.lastBillSummary?.method, 'udhaar');
  assert.ok(
    inlineRes.state.lastVoiceClarity?.understoodTokens.includes('Checkout Complete')
  );

  // 2. Standalone "UPI checkout" on an active bill
  const added = processVoiceTranscript(INITIAL_STATE, 'Ara kilo sugar');
  assert.equal(added.state.activeBill.length, 1);

  const upiCheckout = processVoiceTranscript(added.state, 'UPI checkout');
  assert.equal(upiCheckout.state.activeBill.length, 0);
  assert.equal(upiCheckout.state.salesHistory[0]?.totalAmount, 23);
  assert.equal(upiCheckout.state.salesHistory[0]?.paymentMethod, 'upi');
  assert.equal(upiCheckout.state.lastBillSummary?.method, 'upi');
  assert.ok(
    upiCheckout.state.lastVoiceClarity?.understoodTokens.includes('Checkout Complete')
  );

  // 3. Standalone "checkout" defaults to cash when no customer attached
  const added2 = processVoiceTranscript(INITIAL_STATE, '1 kg atta');
  const cashCheckout = processVoiceTranscript(added2.state, 'checkout');
  assert.equal(cashCheckout.state.activeBill.length, 0);
  assert.equal(cashCheckout.state.salesHistory[0]?.paymentMethod, 'cash');
});

test('Native Telugu & Hindi output localizer converts item-list additions, checkouts, drum stock, and profit into native script with zero English leakage', () => {
  // 1. Giving a list of items -> Telugu
  const itemListEn = 'Added Sugar 500g, Sunflower Oil 2 packets, Groundnuts 167g. Current bill total is 319 rupees.';
  const itemListTe = localizeVoiceResponse(itemListEn, 'te-IN');
  assert.match(itemListTe, /చక్కెర 500 గ్రాములు/);
  assert.match(itemListTe, /సన్‌ఫ్లవర్ నూనె 2 ప్యాకెట్లు/);
  assert.match(itemListTe, /పల్లీలు 167 గ్రాములు/);
  assert.match(itemListTe, /319 రూపాయలు/);
  assert.doesNotMatch(itemListTe, /\b(Added|Current|bill|total|rupees|packets|Sugar)\b/i);

  // 2. Giving a list of items -> Hindi
  const itemListHi = localizeVoiceResponse(itemListEn, 'hi-IN');
  assert.match(itemListHi, /चीनी 500 ग्राम/);
  assert.match(itemListHi, /सनफ्लावर तेल 2 पैकेट/);
  assert.match(itemListHi, /मूंगफली 167 ग्राम/);
  assert.match(itemListHi, /319 रुपये/);
  assert.doesNotMatch(itemListHi, /\b(Added|Current|bill|total|rupees|packets|Sugar)\b/i);

  // 3. Full checkout + low-stock warning -> Telugu & Hindi
  const checkoutEn =
    'Sugar 500g, 2 sunflower oil packets, Groundnuts 167g. Total 319 rupees added to Ramesh account. Warning: Toor Dal only 3 kilos left—added to wholesale refill list. Ready for next customer.';
  const checkoutTe = localizeVoiceResponse(checkoutEn, 'te-IN');
  assert.match(checkoutTe, /Ramesh ఖాతాలో జమ అయ్యాయి/);
  assert.match(checkoutTe, /కందిపప్పు ఇంకా 3 కిలోలు మాత్రమే ఉంది/);
  assert.match(checkoutTe, /తదుపరి కస్టమర్ కోసం సిద్ధంగా ఉన్నాము/);

  const checkoutHi = localizeVoiceResponse(checkoutEn, 'hi-IN');
  assert.match(checkoutHi, /Ramesh के खाते में जोड़ दिए गए हैं/);
  assert.match(checkoutHi, /तूर दाल सिर्फ 3 किलो बचा है/);
  assert.match(checkoutHi, /अगले ग्राहक के लिए तैयार हैं/);

  // 4. Drum stock-in & profit briefing -> Telugu & Hindi
  const drumTe = localizeVoiceResponse(
    'Sugar drum updated to 25 kilos, wholesale 41, selling 46 rupees per kilo.',
    'te-IN'
  );
  assert.match(drumTe, /చక్కెర డ్రమ్ 25 కిలోలు/);
  assert.match(drumTe, /46 రూపాయలు/);

  const profitHi = localizeVoiceResponse(
    'Sales 7,420 rupees, spends 1,670 rupees, net profit 1,940 rupees. Top profit item: Toor Dal at 409 rupees.',
    'hi-IN'
  );
  assert.match(profitHi, /आज की बिक्री 7,420 रुपये/);
  assert.match(profitHi, /तूर दाल, 409 रुपये/);
});

test('Live microphone transcripts without commas parse all items accurately (prefix & suffix quantities)', () => {
  const noComma = processVoiceTranscript(
    INITIAL_STATE,
    'ara kilo sugar rendu oil packets 20 rupees pallilu add to ramesh account checkout'
  );
  assert.equal(noComma.state.activeBill.length, 0);
  assert.equal(noComma.state.salesHistory[0]?.totalAmount, 319);
  assert.equal(noComma.state.salesHistory[0]?.paymentMethod, 'udhaar');

  const suffixQty = processVoiceTranscript(
    INITIAL_STATE,
    'sugar 1 kg toor dal 500 grams'
  );
  assert.equal(suffixQty.state.activeBill.length, 2);
  assert.equal(suffixQty.state.activeBill[0].itemId, 'sugar');
  assert.equal(suffixQty.state.activeBill[0].quantity, 1);
  assert.equal(suffixQty.state.activeBill[1].itemId, 'toor-dal');
  assert.equal(suffixQty.state.activeBill[1].quantity, 0.5);
});

test('Native Telugu and Hindi Unicode transcripts from live SpeechRecognition parse directly into bill items', () => {
  const teluguLive = processVoiceTranscript(
    INITIAL_STATE,
    'అర కిలో చక్కెర రెండు నూనె ప్యాకెట్లు 20 రూపాయల పల్లీలు'
  );
  assert.equal(teluguLive.state.activeBill.length, 3);
  assert.equal(teluguLive.state.activeBill[0].itemId, 'sugar');
  assert.equal(teluguLive.state.activeBill[0].quantity, 0.5);
  assert.equal(teluguLive.state.activeBill[1].itemId, 'sunflower-oil');
  assert.equal(teluguLive.state.activeBill[1].quantity, 2);
  assert.equal(teluguLive.state.activeBill[2].itemId, 'groundnuts');
  assert.equal(teluguLive.state.activeBill[2].displayQty, '167g');

  const hindiLive = processVoiceTranscript(
    INITIAL_STATE,
    'आधा किलो चीनी दो तेल पैकेट 20 रुपये मूंगफली'
  );
  assert.equal(hindiLive.state.activeBill.length, 3);
  assert.equal(hindiLive.state.activeBill[0].itemId, 'sugar');
  assert.equal(hindiLive.state.activeBill[0].quantity, 0.5);
  assert.equal(hindiLive.state.activeBill[1].itemId, 'sunflower-oil');
  assert.equal(hindiLive.state.activeBill[1].quantity, 2);
  assert.equal(hindiLive.state.activeBill[2].itemId, 'groundnuts');
  assert.equal(hindiLive.state.activeBill[2].displayQty, '167g');
});

test('API key validation treats missing, empty, and .env.example placeholder keys as unset', () => {
  assert.equal(isConfiguredApiKey(undefined), false);
  assert.equal(isConfiguredApiKey(''), false);
  assert.equal(isConfiguredApiKey('   '), false);
  assert.equal(isConfiguredApiKey('MY_GEMINI_API_KEY'), false);
  assert.equal(isConfiguredApiKey('your_api_key_here'), false);
  assert.equal(isConfiguredApiKey('your_gemini_api_key_here'), false);
  assert.equal(isConfiguredApiKey('your_sarvam_api_key_here'), false);
  assert.equal(isConfiguredApiKey('placeholder_key'), false);
  assert.equal(isConfiguredApiKey('AIzaSyRealExampleKey12345'), true);
});




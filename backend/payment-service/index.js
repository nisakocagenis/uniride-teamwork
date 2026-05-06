const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let totalProcessed = 0;
let totalAmount = 0;

// Mock payment — tüm ödemeler otomatik onaylanır (Escrow sistemi simülasyonu)
app.post('/api/pay', (req, res) => {
  const { userId, amount } = req.body;
  const transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

  totalProcessed++;
  totalAmount += Number(amount);

  console.log(`[PaymentService] Ödeme isteği alındı`);
  console.log(`  Kullanıcı: #${userId} | Tutar: ₺${amount} | TxID: ${transactionId}`);
  console.log(`[PaymentService] ✓ ONAYLANDI → Escrow'a alındı`);
  console.log(`  Toplam işlem: ${totalProcessed} | Toplam tutar: ₺${totalAmount}`);

  res.json({
    success: true,
    transactionId,
    amount,
    message: 'Ödeme başarıyla işlendi.',
  });
});

app.listen(3004, () => {
  console.log('✅ Payment Service  → http://localhost:3004');
  console.log('   Mock Escrow sistemi hazır — tüm ödemeler otomatik onaylanır');
});

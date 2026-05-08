https://uniride-snowy.vercel.app/
uygulamamızı canlı şekilde test edebilirsiniz 

# UniRide 🚗

Yaşar Üniversitesi — COMP 3304 Fundamentals of Software Engineering  
Dönem Projesi | Mikroservis Mimarisi ile Üniversite Araç Paylaşım Platformu

---

## Proje Hakkında

UniRide, üniversite öğrencilerine özel bir araç paylaşım platformudur. Araç sahibi öğrenciler kullanmadıkları araçlardan ek gelir elde ederken, araçsız öğrenciler kampüse yakın güvenli ve uygun fiyatlı araçlara ulaşabilir. Sisteme yalnızca üniversite hesabıyla giriş yapılabilir.

---

## Ekip

| İsim           | Öğrenci No  |
| -------------- | ----------- |
| Nisa KOCAGENİŞ | 22070001037 |
| Çağrı KAYA     | 22070001019 |
| Zeynep ÖZŞEN   | 23070001024 |
| Yaren KAYA     | 23070001086 |

---

## Teknolojiler

| Katman                   | Teknoloji                    |
| ------------------------ | ---------------------------- |
| Frontend                 | React.js (Create React App)  |
| Backend                  | Node.js + Express.js         |
| Mimari                   | Microservices Architecture   |
| Dosya Yükleme            | Multer                       |
| Servisler Arası İletişim | HTTP / REST                  |
| Veri Depolama            | JSON dosyası (vehicles.json) |

---

## Mimari: Mikroservisler

Sistem birbirinden bağımsız 4 mikroservisten oluşur. Her servis kendi portunda çalışır ve kendi verisini yönetir.

```
┌─────────────────────────────────────────┐
│          CLIENT (React — :3000)         │
└────────────────┬────────────────────────┘
                 │ HTTP / REST
        ┌────────▼────────┐
        │   4 Mikroservis  │
        └─────────────────┘
          │       │       │       │
    :3001   :3002   :3003   :3004
   User   Vehicle  Reser- Payment
  Service Service  vation  Service
                   Service  (Mock)
```

| Servis                  | Port | Görev                                 |
| ----------------------- | ---- | ------------------------------------- |
| **User Service**        | 3001 | Giriş (login) ve token doğrulama      |
| **Vehicle Service**     | 3002 | Araç listeleme, ekleme, müsaitlik     |
| **Reservation Service** | 3003 | Sequence diagram akışını yönetir      |
| **Payment Service**     | 3004 | Mock ödeme — her zaman başarılı döner |
| **Frontend**            | 3000 | React kullanıcı arayüzü               |

---

## Sequence Diagram Akışı

Rezervasyon sürecinde servisler şu sırayla haberleşir:

```
Kullanıcı (UI)
    │
    │  1. "Kirala" butonuna tıklar
    ▼
ReservationService
    │
    │  2. Auth Check (token doğrulama)
    │  3. VehicleService → araç müsaitlik kontrolü
    │  4. Rezervasyon kaydı oluşturulur (status: pending)
    │  5. PaymentService → ödeme isteği gönderilir
    │     PaymentService → 200 OK (mock başarı)
    │  6. Rezervasyon güncellenir (status: confirmed)
    │
    ▼
Kullanıcıya başarı ekranı gösterilir
```

---

## Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org) v18 veya üzeri
- npm (Node.js ile birlikte gelir)

### 1. Bağımlılıkları Yükle

Proje klasöründe terminali aç ve çalıştır:

```bash
.\install.bat
```

Bu komut tüm servislerin ve frontend'in `node_modules` klasörlerini otomatik oluşturur.

> **Not:** `install.bat` yalnızca ilk kurulumda çalıştırılır.

---

## Çalıştırma

### Tüm Servisleri Başlat

```bash
.\start.bat
```

Bu komut 5 ayrı terminal penceresi açar:

- User Service (3001)
- Vehicle Service (3002)
- Payment Service (3004)
- Reservation Service (3003)
- Frontend / React (3000)

### Tarayıcıda Aç

```
http://localhost:3000
```

---

## Demo Hesaplar

| Kullanıcı Adı | Şifre | Rol                                        |
| ------------- | ----- | ------------------------------------------ |
| `yaren`       | `123` | Kiracı (araç kiralar)                      |
| `cagri`       | `123` | Araç Sahibi (araç ekler, ilanlarını görür) |

---

## Kullanım Kılavuzu

### Kiracı (Yaren) Akışı

1. Ana sayfada **"Giriş Yap"** butonuna tıkla
2. `yaren / 123` ile giriş yap
3. Müsait araçları listede gör
4. **"Kirala"** butonuna tıkla
5. Tarihleri seç → **"Ödemeye Geç"**
6. Temsili kart bilgilerini gir → **"Ödemeyi Tamamla"**
7. Rezervasyon onay ekranı gösterilir

### Araç Sahibi (Çağrı) Akışı

1. `cagri / 123` ile giriş yap
2. **"İlanlarım"** sekmesinden araçların durumunu gör
   - 🟢 Müsait: araç kiralanmaya hazır
   - 🔴 Kirada: kiracı adı, tarihler, tutar görünür
3. **"Araç Ekle"** sekmesinden yeni araç ekle
   - Fotoğraf yüklenebilir (JPG, JPEG, PNG — max 5MB)

---

## Proje Klasör Yapısı

```
nisakocagens/
│
├── backend/
│   ├── user-service/          # Port 3001
│   │   └── index.js
│   ├── vehicle-service/       # Port 3002
│   │   ├── index.js
│   │   ├── vehicles.json      # Araç verisi (kalıcı)
│   │   └── uploads/           # Yüklenen araç görselleri
│   ├── reservation-service/   # Port 3003
│   │   └── index.js
│   └── payment-service/       # Port 3004 (Mock)
│       └── index.js
│
├── frontend/
│   ├── public/
│   │   └── images/            # Varsayılan araç görselleri
│   └── src/
│       ├── App.js
│       ├── App.css
│       └── components/
│           ├── Landing.js     # Ana sayfa
│           ├── Login.js       # Giriş ekranı
│           ├── VehicleList.js # Araç listesi
│           ├── AddVehicle.js  # Araç ekleme
│           ├── OwnerDashboard.js # Sahip paneli
│           ├── RentModal.js   # Kiralama modalı
│           └── Confirmation.js # Onay ekranı
│
├── install.bat                # Bağımlılık kurulum scripti
├── start.bat                  # Tüm servisleri başlatma scripti
└── README.md
```

---

## API Endpoints

### User Service — `localhost:3001`

| Method | Endpoint      | Açıklama                      |
| ------ | ------------- | ----------------------------- |
| POST   | `/api/login`  | Kullanıcı girişi, token döner |
| GET    | `/api/verify` | Token doğrulama               |
| POST   | `/api/logout` | Çıkış, token silinir          |

### Vehicle Service — `localhost:3002`

| Method | Endpoint                         | Açıklama             |
| ------ | -------------------------------- | -------------------- |
| GET    | `/api/vehicles`                  | Tüm araçları listele |
| POST   | `/api/vehicles`                  | Yeni araç ekle       |
| GET    | `/api/vehicles/:id`              | Araç detayı          |
| PATCH  | `/api/vehicles/:id/availability` | Müsaitlik güncelle   |
| POST   | `/api/upload`                    | Araç görseli yükle   |

### Reservation Service — `localhost:3003`

| Method | Endpoint            | Açıklama                       |
| ------ | ------------------- | ------------------------------ |
| POST   | `/api/reservations` | Rezervasyon oluştur (tam akış) |
| GET    | `/api/reservations` | Tüm rezervasyonları listele    |

### Payment Service — `localhost:3004`

| Method | Endpoint   | Açıklama                        |
| ------ | ---------- | ------------------------------- |
| POST   | `/api/pay` | Mock ödeme — her zaman başarılı |

---

## Tasarım Deseni: Facade Pattern

`ReservationService` bir **Facade** görevi görür. İstemci yalnızca tek bir endpoint'e istek atar (`POST /api/reservations`). Facade bu isteği alarak tüm servisleri sırasıyla koordine eder:

```
Client
  └── POST /api/reservations
        └── ReservationService (Facade)
              ├── VehicleService.checkAvailability()
              ├── createPendingReservation()
              ├── PaymentService.pay()
              └── confirmReservation()
```

---

## Servis Durdurma

Tüm Node.js süreçlerini durdurmak için:

```powershell
taskkill /F /IM node.exe
```

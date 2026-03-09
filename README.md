# uniride-teamwork

## Project Overview

UniRide is a campus-based vehicle sharing platform designed for university students. 
The system allows students to list their vehicles and rent them to other students within the same university community.

The goal of the platform is to provide a safe, reliable, and convenient transportation alternative for students while ensuring identity verification and secure payments.

## System Services

### Vehicle Listing Service
Allows vehicle owners to add their vehicles, manage pricing, and control availability.

### Reservation & Rental Service
Handles reservation requests, approval or rejection of requests, and tracks rental status.

### Payment Service
Provides secure payment through escrow and manages the payment transfer between renter and vehicle owner.

### Review Service
Allows users to rate each other and report damages after the rental process.

### Identity & Profile Service
Verifies user identity through university email, driver’s license checks, and criminal record verification.

## System Workflow

1. A renter searches for vehicles available on campus.
2. The renter creates a reservation request.
3. The system checks vehicle availability.
4. The renter's identity and eligibility are verified.
5. The vehicle owner approves or rejects the request.
6. If the request is approved, a secure payment process is initiated.
7. After payment confirmation, the reservation is finalized.
8. After the rental period, both users can leave reviews.

## Actors

### Vehicle Owner
Students who list their vehicles on the platform and approve or reject rental requests.

### Renter
Students who search for vehicles and create reservation requests.

### University Student
Users who register using their university email addresses.

### Payment Infrastructure
Handles secure payment transactions.

### e-Government System
Used for identity and criminal record verification.

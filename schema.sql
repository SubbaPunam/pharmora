-- ============================================================
-- Pharmora MySQL Schema
-- Run this once to set up your database
-- ============================================================

CREATE DATABASE IF NOT EXISTS pharmora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pharmora;

-- ─── USERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(15)  DEFAULT NULL,
  street      VARCHAR(255) DEFAULT NULL,
  city        VARCHAR(100) DEFAULT NULL,
  state       VARCHAR(100) DEFAULT NULL,
  pincode     VARCHAR(10)  DEFAULT NULL,
  role        ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  last_login  DATETIME     DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── MEDICINES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicines (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                 VARCHAR(255) NOT NULL,
  description          TEXT         DEFAULT NULL,
  price                DECIMAL(10,2) NOT NULL,
  mrp                  DECIMAL(10,2) DEFAULT NULL,
  category             ENUM('pain','diabetes','vitamins','antibiotics','allergy','injection','digestive','cardiac','other') NOT NULL DEFAULT 'other',
  category_label       VARCHAR(100) DEFAULT NULL,
  manufacturer         VARCHAR(150) DEFAULT 'Generic',
  dosage               VARCHAR(100) DEFAULT NULL,
  stock                INT UNSIGNED NOT NULL DEFAULT 100,
  requires_prescription TINYINT(1) NOT NULL DEFAULT 0,
  badge                ENUM('Popular','New','Rx','Sale','') DEFAULT '',
  image                VARCHAR(500) DEFAULT NULL,
  is_active            TINYINT(1)  NOT NULL DEFAULT 1,
  tags                 JSON         DEFAULT NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT KEY ft_medicine_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ORDERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number       VARCHAR(20)   NOT NULL UNIQUE,
  user_id            INT UNSIGNED  NOT NULL,
  subtotal           DECIMAL(10,2) NOT NULL,
  delivery_fee       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount       DECIMAL(10,2) NOT NULL,
  shipping_street    VARCHAR(255)  DEFAULT NULL,
  shipping_city      VARCHAR(100)  DEFAULT NULL,
  shipping_state     VARCHAR(100)  DEFAULT NULL,
  shipping_pincode   VARCHAR(10)   DEFAULT NULL,
  status             ENUM('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  payment_method     ENUM('cod','online','upi') NOT NULL DEFAULT 'cod',
  payment_status     ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  estimated_delivery DATETIME      DEFAULT NULL,
  delivered_at       DATETIME      DEFAULT NULL,
  notes              TEXT          DEFAULT NULL,
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ORDER ITEMS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    INT UNSIGNED  NOT NULL,
  medicine_id INT UNSIGNED  DEFAULT NULL,
  name        VARCHAR(255)  NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  quantity    INT UNSIGNED  NOT NULL,
  image       VARCHAR(500)  DEFAULT NULL,
  FOREIGN KEY (order_id)    REFERENCES orders(id)    ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── INDEXES ──────────────────────────────────────────────────────
CREATE INDEX idx_orders_user_id   ON orders(user_id);
CREATE INDEX idx_orders_status    ON orders(status);
CREATE INDEX idx_orders_created   ON orders(created_at);
CREATE INDEX idx_medicines_cat    ON medicines(category);
CREATE INDEX idx_medicines_active ON medicines(is_active);

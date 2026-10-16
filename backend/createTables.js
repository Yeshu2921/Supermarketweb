
const pool = require("./db");

async function createTables() {
  try {
    // 1. Branches
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        location VARCHAR(255),
        status ENUM(
          'Active',
          'Inactive',
          'Temporarily Closed'
        ) NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // 2. Product categories and subcategories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        parent_id INT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_category_parent (name, parent_id),
        FOREIGN KEY (parent_id) REFERENCES categories(id)
          ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // 3. Brands
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // 4. Supplier profiles linked to user accounts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL UNIQUE,
        company_name VARCHAR(180) NOT NULL,
        contact_person VARCHAR(150),
        phone VARCHAR(30),
        email VARCHAR(190),
        address VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // 5. Products
    // Purchase prices are stored in product_suppliers,
    // not exposed to workers through the product API.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(180) NOT NULL,
        sku VARCHAR(80) NOT NULL UNIQUE,
        barcode VARCHAR(100) NULL UNIQUE,
        category_id INT NULL,
        brand_id INT NULL,
        description TEXT,
        image_path VARCHAR(255),
        unit VARCHAR(40) NOT NULL DEFAULT 'pieces',
        selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
        status ENUM(
          'Pending',
          'Approved',
          'Rejected',
          'Inactive'
        ) NOT NULL DEFAULT 'Pending',
        created_by INT NULL,
        approved_by INT NULL,
        approved_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
          ON DELETE SET NULL,
        FOREIGN KEY (brand_id) REFERENCES brands(id)
          ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id)
          ON DELETE SET NULL,
        FOREIGN KEY (approved_by) REFERENCES users(id)
          ON DELETE SET NULL,
        INDEX idx_product_name (name),
        INDEX idx_product_status (status),
        INDEX idx_product_category (category_id),
        INDEX idx_product_brand (brand_id)
      ) ENGINE=InnoDB
    `);

    // 6. Products supplied by suppliers
    // A product can have multiple suppliers.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        supplier_id INT NOT NULL,
        purchase_price DECIMAL(12,2) NOT NULL,
        supplier_sku VARCHAR(100),
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_product_supplier (
          product_id, supplier_id
        ),
        FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE CASCADE,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
          ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    // 7. Stock per branch
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branch_inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        low_stock_threshold INT NOT NULL DEFAULT 10,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_branch_product (
          branch_id, product_id
        ),
        FOREIGN KEY (branch_id) REFERENCES branches(id)
          ON DELETE RESTRICT,
        FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    // 8. Sales
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_number VARCHAR(50) NOT NULL UNIQUE,
        branch_id INT NOT NULL,
        sold_by INT NULL,
        customer_name VARCHAR(150)
          NOT NULL DEFAULT 'Walk-in Customer',
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        status ENUM(
          'Completed',
          'Pending',
          'Cancelled'
        ) NOT NULL DEFAULT 'Completed',
        payment_method ENUM(
          'Cash',
          'Card',
          'Bank Transfer',
          'Mobile Money',
          'Other'
        ) NOT NULL DEFAULT 'Cash',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches(id)
          ON DELETE RESTRICT,
        FOREIGN KEY (sold_by) REFERENCES users(id)
          ON DELETE SET NULL,
        INDEX idx_sales_created_at (created_at),
        INDEX idx_sales_status (status),
        INDEX idx_sales_worker (sold_by)
      ) ENGINE=InnoDB
    `);

    // 9. Individual products in each sale
    // unit_cost and unit_price preserve historical profit data.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT NULL,
        product_name_snapshot VARCHAR(180) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        unit_cost DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id)
          ON DELETE RESTRICT,
        FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE SET NULL,
        INDEX idx_sale_items_product (product_id)
      ) ENGINE=InnoDB
    `);

    // 10. Inventory movement history
    // Records stock received, sold, or adjusted.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT NOT NULL,
        product_id INT NOT NULL,
        user_id INT NULL,
        supplier_id INT NULL,
        movement_type ENUM(
          'Stock Received',
          'Sale',
          'Adjustment',
          'Return'
        ) NOT NULL,
        quantity_change INT NOT NULL,
        reference_type VARCHAR(50),
        reference_id INT NULL,
        note VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches(id)
          ON DELETE RESTRICT,
        FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE RESTRICT,
        FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE SET NULL,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
          ON DELETE SET NULL,
        INDEX idx_stock_movement_date (created_at),
        INDEX idx_stock_movement_product (product_id)
      ) ENGINE=InnoDB
    `);

    console.log("==================================");
    console.log("FreshMart database tables created!");
    console.log("1. branches");
    console.log("2. categories");
    console.log("3. brands");
    console.log("4. suppliers");
    console.log("5. products");
    console.log("6. product_suppliers");
    console.log("7. branch_inventory");
    console.log("8. sales");
    console.log("9. sale_items");
    console.log("10. stock_movements");
    console.log("==================================");
  } catch (error) {
    console.error("Database setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

createTables();

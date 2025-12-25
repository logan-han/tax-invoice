import { test, expect } from '@playwright/test';

test.describe('Australian Tax Invoice Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Australian Tax Invoice Generator');
  });

  test('should have all form sections visible', async ({ page }) => {
    await expect(page.getByText('Your Business Details')).toBeVisible();
    await expect(page.getByText('Client Details')).toBeVisible();
    await expect(page.getByText('Invoice Details')).toBeVisible();
    await expect(page.getByText('Invoice Items')).toBeVisible();
  });

  test.describe('Business Details Form', () => {
    test('should allow entering business name', async ({ page }) => {
      const businessNameInput = page.locator('#business-name');
      await businessNameInput.fill('Test Business Pty Ltd');
      await expect(businessNameInput).toHaveValue('Test Business Pty Ltd');
    });

    test('should format ABN correctly', async ({ page }) => {
      const abnInput = page.locator('#business-abn');
      await abnInput.fill('12345678901');
      await expect(abnInput).toHaveValue('12 345 678 901');
    });

    test('should format BSB correctly', async ({ page }) => {
      const bsbInput = page.locator('#business-bsb');
      await bsbInput.fill('123456');
      await expect(bsbInput).toHaveValue('123-456');
    });
  });

  test.describe('Client Details Form', () => {
    test('should allow entering client name', async ({ page }) => {
      const clientNameInput = page.locator('#client-name');
      await clientNameInput.fill('Client Company Ltd');
      await expect(clientNameInput).toHaveValue('Client Company Ltd');
    });

    test('should allow entering client email', async ({ page }) => {
      const emailInput = page.locator('#business-email');
      await emailInput.fill('client@example.com');
      await expect(emailInput).toHaveValue('client@example.com');
    });
  });

  test.describe('Invoice Items', () => {
    test('should add a new item when clicking Add Item', async ({ page }) => {
      // Wait for the auto-added default item to appear first
      await page.waitForSelector('input[placeholder*="Description"]');

      const addButton = page.locator('button:has-text("Add Item")');
      const initialCount = await page.locator('input[placeholder*="Description"]').count();

      await addButton.click();

      const descriptionInputs = page.locator('input[placeholder*="Description"]');
      await expect(descriptionInputs).toHaveCount(initialCount + 1);
    });

    test('should calculate item total correctly', async ({ page }) => {
      // Wait for the auto-added default item
      await page.waitForSelector('input[placeholder*="Description"]');

      const quantityInput = page.locator('input[placeholder="Qty"]').first();
      const priceInput = page.locator('input[placeholder="Price"]').first();

      await quantityInput.fill('5');
      await priceInput.fill('100');

      // Use first() to avoid strict mode violation (value appears in multiple places)
      await expect(page.getByText('$500.00').first()).toBeVisible();
    });

    test('should remove item when clicking delete', async ({ page }) => {
      // Wait for the auto-added default item
      await page.waitForSelector('input[placeholder*="Description"]');

      const addButton = page.locator('button:has-text("Add Item")');
      await addButton.click();
      await addButton.click();

      let descriptionInputs = page.locator('input[placeholder*="Description"]');
      await expect(descriptionInputs).toHaveCount(3); // 1 default + 2 added

      const removeButton = page.locator('button.btn-outline-danger').first();
      await removeButton.click();

      descriptionInputs = page.locator('input[placeholder*="Description"]');
      await expect(descriptionInputs).toHaveCount(2);
    });
  });

  test.describe('Invoice Details', () => {
    test('should have invoice number auto-generated on page load', async ({ page }) => {
      const invoiceNumberInput = page.locator('input[name="invoiceNumber"]');
      // Invoice number is auto-generated on page load
      await expect(invoiceNumberInput).not.toHaveValue('');
    });

    test('should allow setting invoice date', async ({ page }) => {
      const dateInput = page.locator('input[name="invoiceDate"]');
      await dateInput.fill('2025-01-15');
      await expect(dateInput).toHaveValue('2025-01-15');
    });
  });

  test.describe('GST Handling', () => {
    test('should show GST options in dropdown', async ({ page }) => {
      // Wait for the auto-added default item
      await page.waitForSelector('input[placeholder*="Description"]');

      // Use the gst-dropdown class to target the GST select specifically
      const gstSelect = page.locator('.gst-dropdown').first();
      await expect(gstSelect).toBeVisible();

      const options = gstSelect.locator('option');
      await expect(options).toHaveCount(3);
    });
  });

  test.describe('PDF Generation', () => {
    test('should have generate PDF button visible', async ({ page }) => {
      const generatePdfButton = page.getByRole('button', { name: /generate pdf/i });
      await expect(generatePdfButton).toBeVisible();
    });
  });

  test.describe('URL State Persistence', () => {
    test('should update URL when business name is entered', async ({ page }) => {
      const businessNameInput = page.locator('#business-name');
      await businessNameInput.fill('URL Test Business');

      await page.waitForTimeout(500);

      const url = page.url();
      expect(url).toContain('businessName=');
      // URL uses + for spaces (application/x-www-form-urlencoded)
      expect(url).toContain('URL+Test+Business');
    });

    test('should restore state from URL parameters', async ({ page }) => {
      await page.goto('/?businessName=Restored+Business', { waitUntil: 'networkidle' });

      const businessNameInput = page.locator('#business-name');
      await expect(businessNameInput).toHaveValue('Restored Business');
    });
  });
});

test.describe('Full Invoice Workflow', () => {
  test('should complete a full invoice creation workflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1');

    // Wait for the auto-added default item to load
    await page.waitForSelector('input[placeholder*="Description"]');

    // Fill business details
    await page.locator('#business-name').fill('My Business Pty Ltd');
    await page.locator('#business-abn').fill('12345678901');
    await page.locator('#business-bsb').fill('123456');
    await page.locator('#business-accountNumber').fill('12345678');

    // Fill client details
    await page.locator('#client-name').fill('Client Corp');
    await page.locator('#business-email').fill('client@corp.com');

    // Set invoice details
    await page.locator('input[name="invoiceDate"]').fill('2025-01-15');

    // Fill the existing default item (item is auto-added on page load)
    await page.locator('input[placeholder*="Description"]').first().fill('Consulting Services');
    await page.locator('input[placeholder="Qty"]').first().fill('10');
    await page.locator('input[placeholder="Price"]').first().fill('150');

    // Verify total is calculated (use first() to avoid strict mode violation)
    await expect(page.getByText('$1,500.00').first()).toBeVisible();

    // Verify PDF button is available
    const generatePdfButton = page.getByRole('button', { name: /generate pdf/i });
    await expect(generatePdfButton).toBeVisible();
    await expect(generatePdfButton).toBeEnabled();
  });
});

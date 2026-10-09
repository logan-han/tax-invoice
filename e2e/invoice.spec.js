import { test, expect } from '@playwright/test';

const descriptions = (page) => page.locator('input[placeholder="Description"]');

test.describe('Australian Tax Invoice Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Australian Tax Invoice Generator');
  });

  test('should have all form sections visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Your business' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bill to' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invoice', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Line items' })).toBeVisible();
  });

  test.describe('Business Details Form', () => {
    test('should allow entering business name', async ({ page }) => {
      const businessNameInput = page.locator('#business-name');
      await businessNameInput.fill('Test Business Pty Ltd');
      await expect(businessNameInput).toHaveValue('Test Business Pty Ltd');
    });

    test('should format ABN correctly', async ({ page }) => {
      const abnInput = page.locator('#business-abn');
      await abnInput.fill('51824753556');
      await expect(abnInput).toHaveValue('51 824 753 556');
    });

    test('should flag an ABN that fails the check digit test', async ({ page }) => {
      const abnInput = page.locator('#business-abn');
      await abnInput.fill('12345678901');
      await expect(page.getByText('Not a valid ABN')).toBeVisible();
      await expect(abnInput).toHaveAttribute('aria-invalid', 'true');

      await abnInput.fill('51824753556');
      await expect(page.getByText('Not a valid ABN')).toHaveCount(0);
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

    test('should allow entering business email', async ({ page }) => {
      const emailInput = page.locator('#business-email');
      await emailInput.fill('client@example.com');
      await expect(emailInput).toHaveValue('client@example.com');
    });
  });

  test.describe('Invoice Items', () => {
    test('should add a new item when clicking Add item', async ({ page }) => {
      const initialCount = await descriptions(page).count();
      await page.getByRole('button', { name: 'Add new invoice item' }).click();
      await expect(descriptions(page)).toHaveCount(initialCount + 1);
    });

    test('should calculate item line total correctly', async ({ page }) => {
      await page.locator('input[placeholder="Qty"]').first().fill('5');
      await page.locator('input[placeholder="Price"]').first().fill('100');

      // With default +10% GST, 5 * 100 * 1.1 = 550
      await expect(page.getByText('$550.00').first()).toBeVisible();
    });

    test('should accept fractional quantities', async ({ page }) => {
      await page.locator('input[placeholder="Qty"]').first().fill('7.5');
      await page.locator('input[placeholder="Price"]').first().fill('100');

      // 7.5 * 100 * 1.1 = 825
      await expect(page.getByText('$825.00').first()).toBeVisible();
    });

    test('should remove item when clicking the remove button', async ({ page }) => {
      const addButton = page.getByRole('button', { name: 'Add new invoice item' });
      await addButton.click();
      await addButton.click();
      await expect(descriptions(page)).toHaveCount(3);

      await page.getByRole('button', { name: /remove item 1/i }).click();
      await expect(descriptions(page)).toHaveCount(2);
    });

    test('should reorder items with the keyboard', async ({ page }) => {
      await page.getByRole('button', { name: 'Add new invoice item' }).click();
      await descriptions(page).nth(0).fill('First');
      await descriptions(page).nth(1).fill('Second');

      await page.getByRole('button', { name: 'Reorder item 2' }).focus();
      await page.keyboard.press('ArrowUp');

      await expect(descriptions(page).nth(0)).toHaveValue('Second');
      await expect(descriptions(page).nth(1)).toHaveValue('First');
      await expect(page.locator('#invoice tbody tr').first()).toContainText('Second');
    });

    test('should reorder items by dragging the handle', async ({ page }) => {
      await page.getByRole('button', { name: 'Add new invoice item' }).click();
      await descriptions(page).nth(0).fill('First');
      await descriptions(page).nth(1).fill('Second');

      await page.getByRole('group', { name: 'Item 1', exact: true }).hover();
      const handle = page.getByRole('button', { name: 'Reorder item 1' });
      const from = await handle.boundingBox();
      const target = await page.getByRole('group', { name: 'Item 2', exact: true }).boundingBox();

      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(from.x + from.width / 2, target.y + target.height - 4, { steps: 8 });
      await page.mouse.up();

      await expect(descriptions(page).nth(0)).toHaveValue('Second');
      await expect(descriptions(page).nth(1)).toHaveValue('First');
    });

    test('should drag an item past several others', async ({ page }) => {
      const addButton = page.getByRole('button', { name: 'Add new invoice item' });
      for (let i = 1; i < 4; i++) await addButton.click();
      for (const [i, name] of ['A', 'B', 'C', 'D'].entries()) {
        await descriptions(page).nth(i).fill(name);
      }

      await page.getByRole('group', { name: 'Item 1', exact: true }).hover();
      const from = await page.getByRole('button', { name: 'Reorder item 1' }).boundingBox();
      const last = await page.getByRole('group', { name: 'Item 4', exact: true }).boundingBox();

      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(from.x + from.width / 2, last.y + last.height - 2, { steps: 20 });
      await page.mouse.up();

      await expect
        .poll(() => descriptions(page).evaluateAll((inputs) => inputs.map((i) => i.value)))
        .toEqual(['B', 'C', 'D', 'A']);
    });
  });

  test.describe('Invoice Details', () => {
    test('should have invoice number auto-generated on page load', async ({ page }) => {
      const invoiceNumberInput = page.locator('input[name="invoiceNumber"]');
      await expect(invoiceNumberInput).not.toHaveValue('');
    });

    test('should allow setting invoice date', async ({ page }) => {
      const dateInput = page.locator('input[name="invoiceDate"]');
      await dateInput.fill('2025-01-15');
      await expect(dateInput).toHaveValue('2025-01-15');
    });

    test('should keep a typed invoice number when the date changes', async ({ page }) => {
      const number = page.locator('input[name="invoiceNumber"]');
      await number.fill('INV-042');
      await page.locator('input[name="invoiceDate"]').fill('2025-01-15');
      await expect(number).toHaveValue('INV-042');
    });
  });

  test.describe('GST Handling', () => {
    test('should show GST options as segmented control', async ({ page }) => {
      const gstGroup = page.getByRole('radiogroup', { name: /item 1 gst/i });
      await expect(gstGroup).toBeVisible();

      const options = gstGroup.getByRole('radio');
      await expect(options).toHaveCount(3);
      await expect(options.nth(0)).toHaveText('No');
      await expect(options.nth(1)).toHaveText('+10%');
      await expect(options.nth(2)).toHaveText('Incl.');
    });

    test('should switch GST mode when tapping a segment', async ({ page }) => {
      const gstGroup = page.getByRole('radiogroup', { name: /item 1 gst/i });
      const inclusive = gstGroup.getByRole('radio', { name: 'Incl.' });

      await inclusive.click();
      await expect(inclusive).toHaveAttribute('aria-checked', 'true');
    });

    test('should title the invoice by whether any GST is charged', async ({ page }) => {
      const kicker = page.locator('#invoice .inv-badge-kicker');
      await expect(kicker).toHaveText('Tax Invoice');

      await page
        .getByRole('radiogroup', { name: /item 1 gst/i })
        .getByRole('radio', { name: 'No' })
        .click();
      await expect(kicker).toHaveText('Invoice');
    });
  });

  test.describe('PDF Generation', () => {
    test('should download the invoice as a PDF', async ({ page }) => {
      await page.locator('input[name="invoiceNumber"]').fill('E2E-1');

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: /generate pdf/i }).click(),
      ]);

      expect(download.suggestedFilename()).toBe('invoice-E2E-1.pdf');
      const chunks = [];
      for await (const chunk of await download.createReadStream()) chunks.push(chunk);
      const pdf = Buffer.concat(chunks).toString('latin1');
      expect(pdf.length).toBeGreaterThan(10_000);
      // The invisible text layer makes the number searchable and copyable.
      expect(pdf).toContain('(E2E-1) Tj');
    });
  });

  test.describe('URL State Persistence', () => {
    test('should update URL when business name is entered', async ({ page }) => {
      await page.locator('#business-name').fill('URL Test Business');

      await expect.poll(() => page.url()).toContain('businessName=URL+Test+Business');
    });

    test('should restore state from URL parameters', async ({ page }) => {
      await page.goto('/?businessName=Restored+Business', { waitUntil: 'networkidle' });

      await expect(page.locator('#business-name')).toHaveValue('Restored Business');
    });

    test('should keep every item and its details across a reload', async ({ page }) => {
      const addButton = page.getByRole('button', { name: 'Add new invoice item' });
      for (let i = 1; i < 12; i++) await addButton.click();
      for (let i = 0; i < 12; i++)
        await descriptions(page)
          .nth(i)
          .fill(`Line ${i + 1}`);
      await page.locator('#item-qty-0').fill('7.5');

      const savedItems = () => new URL(page.url()).searchParams.get('items') ?? '';
      await expect.poll(savedItems).toContain('"name":"Line 12"');
      await expect.poll(savedItems).toContain('"quantity":7.5');
      await page.reload({ waitUntil: 'networkidle' });

      await expect(descriptions(page)).toHaveCount(12);
      await expect(descriptions(page).nth(11)).toHaveValue('Line 12');
      await expect(page.locator('#item-qty-0')).toHaveValue('7.5');
    });

    test('should keep up with fast typing', async ({ page }) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));

      const text = 'Thanks for your business. '.repeat(6).trim();
      await page.locator('#invoiceNotes').fill('');
      await page.locator('#invoiceNotes').pressSequentially(text);

      const savedNotes = () =>
        JSON.parse(new URL(page.url()).searchParams.get('invoice') ?? '{}').notes;
      await expect.poll(savedNotes).toBe(text);
      expect(errors).toEqual([]);
    });
  });
});

test.describe('Dates', () => {
  test.use({ timezoneId: 'Australia/Melbourne' });

  test('should default to today in Australia, not the UTC date', async ({ page }) => {
    // 9:30am on 10 Oct in Melbourne, still 9 Oct in UTC.
    await page.clock.setFixedTime(new Date('2026-10-09T22:30:00Z'));
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.locator('input[name="invoiceDate"]')).toHaveValue('2026-10-10');
    await expect(page.locator('input[name="dueDate"]')).toHaveValue('2026-11-09');
  });
});

test.describe('Full Invoice Workflow', () => {
  test('should complete a full invoice creation workflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1');

    // Fill business details
    await page.locator('#business-name').fill('My Business Pty Ltd');
    await page.locator('#business-abn').fill('51824753556');
    await page.locator('#business-bsb').fill('123456');
    await page.locator('#business-accountNumber').fill('12345678');

    // Fill client details
    await page.locator('#client-name').fill('Client Corp');
    await page.locator('#business-email').fill('client@corp.com');

    // Set invoice details
    await page.locator('input[name="invoiceDate"]').fill('2025-01-15');

    // Fill the default item
    await descriptions(page).first().fill('Consulting Services');
    await page.locator('input[placeholder="Qty"]').first().fill('10');
    await page.locator('input[placeholder="Price"]').first().fill('150');

    // Switch this item's GST to No so the line total matches 10 * 150 = 1500
    const gstGroup = page.getByRole('radiogroup', { name: /item 1 gst/i });
    await gstGroup.getByRole('radio', { name: 'No' }).click();

    await expect(page.getByText('$1,500.00').first()).toBeVisible();

    // Verify PDF button is available
    const generatePdfButton = page.getByRole('button', { name: /generate pdf/i });
    await expect(generatePdfButton).toBeVisible();
    await expect(generatePdfButton).toBeEnabled();
  });
});

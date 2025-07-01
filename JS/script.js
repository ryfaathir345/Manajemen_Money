// Data storage
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let bankAccounts = JSON.parse(localStorage.getItem("bankAccounts")) || [];
let filteredTransactions = [];
let editingId = null;
let currentFilter = { type: "all" };

// Categories
const categories = {
  income: ["Gaji", "Bonus", "Freelance", "Investasi", "Hadiah", "Lainnya"],
  expense: [
    "Makanan",
    "Transportasi",
    "Belanja",
    "Tagihan",
    "Hiburan",
    "Kesehatan",
    "Pendidikan",
    "Lainnya",
  ],
  transfer: ["Transfer Antar Akun"],
};

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  // Set today's date
  document.getElementById("date").valueAsDate = new Date();

  // Initialize default bank accounts if empty
  initializeDefaultBanks();

  // Initialize filter options
  initializeFilterOptions();

  // Load bank balances
  loadBankBalances();

  // Update payment method options
  updatePaymentMethods();

  // Load transactions
  applyFilter();

  // Form submission
  document
    .getElementById("transactionForm")
    .addEventListener("submit", handleSubmit);

  // Type change handler
  document.getElementById("type").addEventListener("change", function () {
    updateCategories();
    toggleTransferFields();
  });

  // Bank account change handler
  document
    .getElementById("bankAccount")
    .addEventListener("change", function () {
      const customGroup = document.getElementById("customBankGroup");
      customGroup.style.display = this.value === "Custom" ? "block" : "none";
    });
});

/**
 * Initializes default bank accounts if no accounts are stored in localStorage.
 */
function initializeDefaultBanks() {
  if (bankAccounts.length === 0) {
    bankAccounts = [
      { name: "DANA", balance: 10000 },
      { name: "GoPay", balance: 0 },
      { name: "ShopeePay", balance: 0 },
      { name: "OVO", balance: 0 },
      { name: "SeaBank", balance: 0 },
      { name: "Bank Jatim", balance: 0 },
      { name: "BCA", balance: 0 },
      { name: "BRI", balance: 0 },
      { name: "BNI", balance: 0 },
      { name: "Mandiri", balance: 0 },
      { name: "Cash", balance: 0 },
    ];
    saveBankAccounts();
  }
}

/**
 * Saves the current bank accounts array to localStorage.
 */
function saveBankAccounts() {
  localStorage.setItem("bankAccounts", JSON.stringify(bankAccounts));
}

/**
 * Loads and displays bank balances in the bank grid.
 */
function loadBankBalances() {
  const bankGrid = document.getElementById("bankGrid");
  bankGrid.innerHTML = "";

  if (bankAccounts.length === 0) {
    bankGrid.innerHTML =
      '<p style="text-align: center; color: #7f8c8d;">Belum ada akun bank/e-wallet. Tambahkan yang pertama!</p>';
    return;
  }

  bankAccounts.forEach((bank) => {
    bankGrid.innerHTML += `
      <div class="bank-card">
          <div class="bank-name">${bank.name}</div>
          <div class="bank-balance">${formatCurrency(bank.balance)}</div>
          <div class="bank-actions">
              <button class="btn-bank" onclick="editBank('${
                bank.name
              }')">Edit</button>
              <button class="btn-bank" onclick="deleteBank('${
                bank.name
              }')">Hapus</button>
          </div>
      </div>
  `;
  });
  updatePaymentMethods(); // Update payment methods whenever bank balances are loaded
}

/**
 * Updates the balance of an existing bank account or adds a new custom bank account.
 */
function updateBankBalance() {
  const bankName = document.getElementById("bankAccount").value;
  const customBank = document.getElementById("customBank").value.trim();
  const balance =
    parseFloat(document.getElementById("currentBalance").value) || 0;

  if (!bankName && !customBank) {
    alert("Pilih akun atau masukkan nama bank/e-wallet baru.");
    return;
  }

  let targetBankName = bankName;
  if (bankName === "Custom") {
    if (!customBank) {
      alert("Masukkan nama bank/e-wallet kustom.");
      return;
    }
    targetBankName = customBank;
  }

  const existingBank = bankAccounts.find(
    (b) => b.name.toLowerCase() === targetBankName.toLowerCase()
  );

  if (existingBank) {
    existingBank.balance = balance;
  } else {
    bankAccounts.push({ name: targetBankName, balance });
  }

  saveBankAccounts();
  loadBankBalances();
  alert(`Saldo ${targetBankName} berhasil diperbarui.`);
  document.getElementById("bankAccount").value = "";
  document.getElementById("customBank").value = "";
  document.getElementById("currentBalance").value = "";
  document.getElementById("customBankGroup").style.display = "none";
}

/**
 * Adds a new bank account with an initial balance of 0.
 */
function addNewBank() {
  const customBank = document.getElementById("customBank").value.trim();
  if (!customBank) {
    alert("Masukkan nama bank/e-wallet baru.");
    return;
  }

  const existingBank = bankAccounts.find(
    (b) => b.name.toLowerCase() === customBank.toLowerCase()
  );
  if (existingBank) {
    alert("Bank/E-Wallet dengan nama ini sudah ada.");
    return;
  }

  bankAccounts.push({ name: customBank, balance: 0 });
  saveBankAccounts();
  loadBankBalances();
  alert(`${customBank} berhasil ditambahkan.`);
  document.getElementById("customBank").value = "";
  document.getElementById("bankAccount").value = ""; // Reset dropdown
  document.getElementById("customBankGroup").style.display = "none";
}

/**
 * Populates the bank account details into the update form for editing.
 * @param {string} name - The name of the bank account to edit.
 */
function editBank(name) {
  const bank = bankAccounts.find((b) => b.name === name);
  if (bank) {
    document.getElementById("bankAccount").value = bank.name;
    document.getElementById("currentBalance").value = bank.balance;
    document.getElementById("customBankGroup").style.display = "none"; // Hide custom input if editing existing
  }
}

/**
 * Deletes a bank account after confirmation.
 * @param {string} name - The name of the bank account to delete.
 */
function deleteBank(name) {
  if (
    confirm(
      `Apakah Anda yakin ingin menghapus akun ${name}? Semua transaksi terkait akan tetap ada, tetapi saldo tidak akan diperbarui.`
    )
  ) {
    bankAccounts = bankAccounts.filter((b) => b.name !== name);
    saveBankAccounts();
    loadBankBalances();
    alert(`${name} berhasil dihapus.`);
  }
}

/**
 * Handles the form submission for adding or updating a transaction.
 * @param {Event} e - The submit event.
 */
function handleSubmit(e) {
  e.preventDefault();

  const type = document.getElementById("type").value;
  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const description = document.getElementById("description").value;

  if (!date || !type || !category || isNaN(amount) || amount <= 0) {
    alert("Harap lengkapi semua kolom yang wajib diisi dengan benar.");
    return;
  }

  let formData = {
    date: date,
    type: type,
    category: category,
    amount: amount,
    description: description,
  };

  if (type === "transfer") {
    const fromAccount = document.getElementById("fromAccount").value;
    const toAccount = document.getElementById("toAccount").value;

    if (!fromAccount || !toAccount || fromAccount === toAccount) {
      alert("Pilih akun asal dan tujuan yang berbeda untuk transfer.");
      return;
    }

    formData.fromAccount = fromAccount;
    formData.toAccount = toAccount;
    formData.paymentMethod = `${formData.fromAccount} → ${formData.toAccount}`;

    // Update bank balances for transfer
    updateBankBalanceForTransaction(formData.fromAccount, -formData.amount);
    updateBankBalanceForTransaction(formData.toAccount, formData.amount);
  } else {
    const paymentMethod = document.getElementById("paymentMethod").value;
    if (!paymentMethod) {
      alert("Pilih metode pembayaran.");
      return;
    }
    formData.paymentMethod = paymentMethod;

    // Update bank balance for income/expense
    const multiplier = type === "income" ? 1 : -1;
    updateBankBalanceForTransaction(
      formData.paymentMethod,
      formData.amount * multiplier
    );
  }

  if (editingId) {
    // Update existing transaction
    const index = transactions.findIndex((t) => t.id === editingId);
    if (index !== -1) {
      // Revert old balance changes before applying new ones if editing
      const oldTransaction = transactions[index];
      if (oldTransaction.type === "transfer") {
        updateBankBalanceForTransaction(
          oldTransaction.fromAccount,
          oldTransaction.amount
        ); // Add back to fromAccount
        updateBankBalanceForTransaction(
          oldTransaction.toAccount,
          -oldTransaction.amount
        ); // Subtract from toAccount
      } else {
        const oldMultiplier = oldTransaction.type === "income" ? -1 : 1;
        updateBankBalanceForTransaction(
          oldTransaction.paymentMethod,
          oldTransaction.amount * oldMultiplier
        );
      }

      transactions[index] = { ...formData, id: editingId };
    }
    editingId = null;
    document.querySelector('button[type="submit"]').textContent =
      "✅ Tambah Transaksi";
    alert("Transaksi berhasil diperbarui!");
  } else {
    // Add new transaction
    const transaction = {
      ...formData,
      id: Date.now().toString(),
    };
    transactions.push(transaction);
    alert("Transaksi berhasil ditambahkan!");
  }

  saveTransactions();
  saveBankAccounts(); // Save bank accounts after balance updates
  loadBankBalances(); // Reload bank balances to reflect changes
  applyFilter();
  resetForm();
}

/**
 * Updates the balance of a specific bank account.
 * @param {string} bankName - The name of the bank account.
 * @param {number} amount - The amount to add or subtract from the balance.
 */
function updateBankBalanceForTransaction(bankName, amount) {
  const bank = bankAccounts.find((b) => b.name === bankName);
  if (bank) {
    bank.balance += amount;
  } else {
    console.warn(
      `Bank account "${bankName}" not found. Cannot update balance.`
    );
  }
}

/**
 * Saves the current transactions array to localStorage.
 */
function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

/**
 * Resets the transaction form to its initial state.
 */
function resetForm() {
  document.getElementById("transactionForm").reset();
  document.getElementById("date").valueAsDate = new Date();
  document.getElementById("category").innerHTML =
    '<option value="">Pilih Kategori</option>';
  document.getElementById("transferGroup").style.display = "none";
  document.getElementById("paymentMethod").style.display = "block"; // Ensure payment method is visible
  document.querySelector('label[for="paymentMethod"]').style.display = "block";
  updatePaymentMethods();
  updateCategories(); // Reset categories based on default type (income)
}

/**
 * Formats a date string into a localized, readable format.
 * @param {string} dateString - The date string (e.g., "YYYY-MM-DD").
 * @returns {string} The formatted date string.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats a number into Indonesian Rupiah currency format.
 * @param {number} amount - The amount to format.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Updates the category dropdown based on the selected transaction type (income, expense, transfer).
 */
function updateCategories() {
  const type = document.getElementById("type").value;
  const categorySelect = document.getElementById("category");
  categorySelect.innerHTML = '<option value="">Pilih Kategori</option>';

  if (type && categories[type]) {
    categories[type].forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });
  }
}

/**
 * Toggles the visibility of transfer-specific fields based on the transaction type.
 */
function toggleTransferFields() {
  const type = document.getElementById("type").value;
  const transferGroup = document.getElementById("transferGroup");
  const paymentMethodGroup = document
    .getElementById("paymentMethod")
    .closest(".input-group");

  if (type === "transfer") {
    transferGroup.style.display = "flex";
    paymentMethodGroup.style.display = "none"; // Hide payment method for transfers
    updateTransferAccountOptions();
  } else {
    transferGroup.style.display = "none";
    paymentMethodGroup.style.display = "block"; // Show payment method for income/expense
  }
}

/**
 * Populates the payment method dropdown with available bank accounts.
 */
function updatePaymentMethods() {
  const paymentMethodSelect = document.getElementById("paymentMethod");
  paymentMethodSelect.innerHTML = '<option value="">Pilih Akun</option>';
  bankAccounts.forEach((bank) => {
    const option = document.createElement("option");
    option.value = bank.name;
    option.textContent = bank.name;
    paymentMethodSelect.appendChild(option);
  });
}

/**
 * Populates the 'From Account' and 'To Account' dropdowns for transfer transactions.
 */
function updateTransferAccountOptions() {
  const fromAccountSelect = document.getElementById("fromAccount");
  const toAccountSelect = document.getElementById("toAccount");

  fromAccountSelect.innerHTML = '<option value="">Pilih Akun Asal</option>';
  toAccountSelect.innerHTML = '<option value="">Pilih Akun Tujuan</option>';

  bankAccounts.forEach((bank) => {
    const fromOption = document.createElement("option");
    fromOption.value = bank.name;
    fromOption.textContent = bank.name;
    fromAccountSelect.appendChild(fromOption);

    const toOption = document.createElement("option");
    toOption.value = bank.name;
    toOption.textContent = bank.name;
    toAccountSelect.appendChild(toOption);
  });
}

/**
 * Applies the current filter settings to the transactions and updates the display.
 */
function applyFilter() {
  let tempTransactions = [...transactions];

  const filterType = currentFilter.type;
  const startDate = currentFilter.startDate
    ? new Date(currentFilter.startDate)
    : null;
  const endDate = currentFilter.endDate
    ? new Date(currentFilter.endDate)
    : null;
  const filterMonth = currentFilter.month;
  const filterYear = currentFilter.year;

  if (filterType === "dateRange" && startDate && endDate) {
    tempTransactions = tempTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  } else if (filterType === "month" && filterMonth) {
    tempTransactions = tempTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() + 1 === parseInt(filterMonth);
    });
  } else if (filterType === "year" && filterYear) {
    tempTransactions = tempTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === parseInt(filterYear);
    });
  }

  filteredTransactions = tempTransactions.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  displayTransactions();
  updateSummary();
}

/**
 * Toggles the visibility of filter options based on the selected filter type.
 */
function toggleFilterOptions() {
  const filterType = document.getElementById("filterType").value;
  document.getElementById("dateRangeFilter").style.display = "none";
  document.getElementById("dateRangeFilter2").style.display = "none";
  document.getElementById("monthFilter").style.display = "none";
  document.getElementById("yearFilter").style.display = "none";

  if (filterType === "dateRange") {
    document.getElementById("dateRangeFilter").style.display = "block";
    document.getElementById("dateRangeFilter2").style.display = "block";
  } else if (filterType === "month") {
    document.getElementById("monthFilter").style.display = "block";
  } else if (filterType === "year") {
    document.getElementById("yearFilter").style.display = "block";
  }

  // Update currentFilter object and apply filter
  currentFilter.type = filterType;
  currentFilter.startDate = document.getElementById("startDate").value;
  currentFilter.endDate = document.getElementById("endDate").value;
  currentFilter.month = document.getElementById("filterMonth").value;
  currentFilter.year = document.getElementById("filterYear").value;
  applyFilter();
}

/**
 * Initializes the month and year options for the filter dropdowns.
 */
function initializeFilterOptions() {
  const monthSelect = document.getElementById("filterMonth");
  const yearSelect = document.getElementById("filterYear");
  const currentYear = new Date().getFullYear();

  // Populate months
  const months = [
    { value: "1", name: "Januari" },
    { value: "2", name: "Februari" },
    { value: "3", name: "Maret" },
    { value: "4", name: "April" },
    { value: "5", name: "Mei" },
    { value: "6", name: "Juni" },
    { value: "7", name: "Juli" },
    { value: "8", name: "Agustus" },
    { value: "9", name: "September" },
    { value: "10", name: "Oktober" },
    { value: "11", name: "November" },
    { value: "12", name: "Desember" },
  ];
  months.forEach((month) => {
    const option = document.createElement("option");
    option.value = month.value;
    option.textContent = month.name;
    monthSelect.appendChild(option);
  });

  // Populate years (e.g., current year - 5 to current year + 1)
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    yearSelect.appendChild(option);
  }
}

/**
 * Displays the filtered transactions in the transaction table.
 */
function displayTransactions() {
  const transactionBody = document.getElementById("transactionBody");
  transactionBody.innerHTML = "";
  document.getElementById(
    "totalTransactions"
  ).textContent = `${filteredTransactions.length} transaksi`;

  if (filteredTransactions.length === 0) {
    transactionBody.innerHTML = `
      <tr>
          <td colspan="6" class="empty-state">
              <div>
                  <div style="font-size: 3rem; margin-bottom: 10px;">📝</div>
                  <h3>Belum ada transaksi</h3>
                  <p>Mulai dengan menambahkan transaksi pertama Anda</p>
              </div>
          </td>
      </tr>
  `;
    return;
  }

  filteredTransactions.forEach((transaction) => {
    const row = transactionBody.insertRow();
    row.innerHTML = `
      <td>${formatDate(transaction.date)}</td>
      <td style="color: ${getTransactionColor(
        transaction.type
      )}; font-weight: bold;">${
      transaction.type === "income"
        ? "Pemasukan"
        : transaction.type === "expense"
        ? "Pengeluaran"
        : "Transfer"
    }</td>
      <td>${transaction.category}</td>
      <td>${transaction.paymentMethod}</td>
      <td>${transaction.description || "-"}</td>
      <td>
          <button class="btn-action btn-edit" onclick="editTransaction('${
            transaction.id
          }')">✏️</button>
          <button class="btn-action btn-delete" onclick="deleteTransaction('${
            transaction.id
          }')">🗑️</button>
      </td>
  `;
    // Add amount column for better visibility
    const amountCell = row.insertCell(4); // Insert before description
    amountCell.textContent = formatCurrency(transaction.amount);
    amountCell.style.color = getTransactionColor(transaction.type);
    amountCell.style.fontWeight = "bold";
  });

  // Adjust table header to include 'Jumlah'
  const tableHeader = document.querySelector("#transactionTable thead tr");
  if (
    !tableHeader.querySelector("th:nth-child(5)").textContent.includes("Jumlah")
  ) {
    const amountHeader = document.createElement("th");
    amountHeader.textContent = "Jumlah";
    tableHeader.insertBefore(amountHeader, tableHeader.children[4]); // Insert before Description
  }
}

/**
 * Updates the summary cards (Total Income, Total Expense, Total Balance).
 */
function updateSummary() {
  let totalIncome = 0;
  let totalExpense = 0;

  filteredTransactions.forEach((t) => {
    if (t.type === "income") {
      totalIncome += t.amount;
    } else if (t.type === "expense") {
      totalExpense += t.amount;
    }
  });

  const overallBalance = bankAccounts.reduce(
    (sum, bank) => sum + bank.balance,
    0
  );

  document.getElementById("totalIncome").textContent =
    formatCurrency(totalIncome);
  document.getElementById("totalExpense").textContent =
    formatCurrency(totalExpense);
  document.getElementById("totalBalance").textContent =
    formatCurrency(overallBalance);

  // Update period text for summary
  let periodText = "";
  if (currentFilter.type === "all") {
    periodText = "Semua Waktu";
  } else if (currentFilter.type === "dateRange") {
    const start = currentFilter.startDate
      ? formatDate(currentFilter.startDate)
      : "";
    const end = currentFilter.endDate ? formatDate(currentFilter.endDate) : "";
    periodText = `Periode: ${start} - ${end}`;
  } else if (currentFilter.type === "month") {
    const monthName = new Date(
      2000,
      parseInt(currentFilter.month) - 1,
      1
    ).toLocaleString("id-ID", { month: "long" });
    periodText = `Bulan: ${monthName}`;
  } else if (currentFilter.type === "year") {
    periodText = `Tahun: ${currentFilter.year}`;
  }

  document.getElementById("periodIncome").textContent = periodText;
  document.getElementById("periodExpense").textContent = periodText;
  document.getElementById("periodBalance").textContent = "Total Saldo Akun";
}

/**
 * Sets the form fields for editing an existing transaction.
 * @param {string} id - The ID of the transaction to edit.
 */
function editTransaction(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (transaction) {
    editingId = id;
    document.getElementById("date").value = transaction.date;
    document.getElementById("type").value = transaction.type;
    updateCategories(); // Update categories first
    document.getElementById("category").value = transaction.category;
    document.getElementById("amount").value = transaction.amount;
    document.getElementById("description").value = transaction.description;

    toggleTransferFields(); // Adjust visibility based on type

    if (transaction.type === "transfer") {
      document.getElementById("fromAccount").value = transaction.fromAccount;
      document.getElementById("toAccount").value = transaction.toAccount;
    } else {
      document.getElementById("paymentMethod").value =
        transaction.paymentMethod;
    }

    document.querySelector('button[type="submit"]').textContent =
      "💾 Update Transaksi";
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top to see the form
  }
}

/**
 * Deletes a transaction and reverts its impact on bank balances.
 * @param {string} id - The ID of the transaction to delete.
 */
function deleteTransaction(id) {
  if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
    const transactionToDelete = transactions.find((t) => t.id === id);
    if (transactionToDelete) {
      // Revert balance changes
      if (transactionToDelete.type === "income") {
        updateBankBalanceForTransaction(
          transactionToDelete.paymentMethod,
          -transactionToDelete.amount
        );
      } else if (transactionToDelete.type === "expense") {
        updateBankBalanceForTransaction(
          transactionToDelete.paymentMethod,
          transactionToDelete.amount
        );
      } else if (transactionToDelete.type === "transfer") {
        updateBankBalanceForTransaction(
          transactionToDelete.fromAccount,
          transactionToDelete.amount
        ); // Add back to fromAccount
        updateBankBalanceForTransaction(
          transactionToDelete.toAccount,
          -transactionToDelete.amount
        ); // Subtract from toAccount
      }
    }

    transactions = transactions.filter((t) => t.id !== id);
    saveTransactions();
    saveBankAccounts(); // Save bank accounts after balance updates
    loadBankBalances(); // Reload bank balances to reflect changes
    applyFilter();
    alert("Transaksi berhasil dihapus!");
  }
}

/**
 * Downloads the filtered transaction data as an Excel (XLSX) file.
 */
function downloadExcel() {
  if (filteredTransactions.length === 0) {
    alert("Tidak ada data untuk diunduh.");
    return;
  }

  const data = filteredTransactions.map((t) => ({
    Tanggal: formatDate(t.date),
    Jenis:
      t.type === "income"
        ? "Pemasukan"
        : t.type === "expense"
        ? "Pengeluaran"
        : "Transfer",
    Kategori: t.category,
    Jumlah: t.amount,
    "Metode Pembayaran": t.paymentMethod,
    Deskripsi: t.description || "",
  }));

  const header = [
    "Tanggal",
    "Jenis",
    "Kategori",
    "Jumlah",
    "Metode Pembayaran",
    "Deskripsi",
  ];

  const ws = XLSX.utils.json_to_sheet(data, { header });

  // Auto width kolom
  const wscols = [
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
    { wch: 20 },
    { wch: 30 },
  ];
  ws["!cols"] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transaksi Keuangan");

  XLSX.writeFile(wb, "Laporan_Keuangan.xlsx");
  alert("Data berhasil diunduh sebagai Excel!");
}

/**
 * Downloads the filtered transaction data as a CSV file.
 */
function downloadCSV() {
  if (filteredTransactions.length === 0) {
    alert("Tidak ada data untuk diunduh.");
    return;
  }

  const headers = [
    "Tanggal",
    "Jenis",
    "Kategori",
    "Jumlah",
    "Metode Pembayaran",
    "Deskripsi",
  ];
  const rows = filteredTransactions.map((t) => [
    formatDate(t.date),
    t.type === "income"
      ? "Pemasukan"
      : t.type === "expense"
      ? "Pengeluaran"
      : "Transfer",
    t.category,
    t.amount,
    t.paymentMethod,
    `"${(t.description || "").replace(/"/g, '""')}"`, // Escape double quotes for CSV
  ]);

  let csvContent = headers.join(",") + "\n";
  rows.forEach((row) => {
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    // Feature detection for download attribute
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Laporan_Keuangan.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Data berhasil diunduh sebagai CSV!");
  } else {
    alert(
      "Browser Anda tidak mendukung pengunduhan CSV secara langsung. Silakan salin data dari tabel."
    );
  }
}

/**
 * Clears all transaction and bank account data from localStorage after confirmation.
 */
function clearAllData() {
  if (
    confirm(
      "Apakah Anda yakin ingin menghapus SEMUA data transaksi dan saldo bank? Tindakan ini tidak dapat dibatalkan."
    )
  ) {
    localStorage.removeItem("transactions");
    localStorage.removeItem("bankAccounts");
    transactions = [];
    bankAccounts = [];
    editingId = null;
    currentFilter = { type: "all" };
    initializeDefaultBanks(); // Re-initialize default banks
    loadBankBalances();
    applyFilter();
    resetForm();
    alert("Semua data berhasil dihapus!");
  }
}

/**
 * Resets the filter to "All Data" and re-applies it.
 */
function resetFilter() {
  document.getElementById("filterType").value = "all";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("filterMonth").value = "";
  document.getElementById("filterYear").value = "";
  currentFilter = { type: "all" };
  toggleFilterOptions(); // This will also call applyFilter()
  alert("Filter berhasil direset!");
}

/**
 * Downloads the currently filtered data as an Excel file.
 */
function downloadFilteredData() {
  downloadCSV(); // Re-use the existing downloadExcel function
}

/**
 * Returns the color code for a given transaction type.
 * @param {string} type - The type of transaction ('income', 'expense', 'transfer').
 * @returns {string} The hex color code.
 */
function getTransactionColor(type) {
  return type === "income"
    ? "#27ae60"
    : type === "expense"
    ? "#e74c3c"
    : "#3498db";
}

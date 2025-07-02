let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let bankAccounts = JSON.parse(localStorage.getItem("bankAccounts")) || [];
let filteredTransactions = [];
let editingId = null;
let currentFilter = { type: "all" };

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

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("date").valueAsDate = new Date();

  initializeDefaultBanks();

  initializeFilterOptions();

  loadBankBalances();

  updatePaymentMethods();

  applyFilter();

  updateTransferAccountOptions();

  document
    .getElementById("transactionForm")
    .addEventListener("submit", handleSubmit);

  document.getElementById("type").addEventListener("change", function () {
    updateCategories();
    toggleTransferFields();
  });

  document
    .getElementById("bankAccount")
    .addEventListener("change", function () {
      const customGroup = document.getElementById("customBankGroup");
      customGroup.style.display = this.value === "Custom" ? "block" : "none";
    });
});

function initializeDefaultBanks() {
  if (bankAccounts.length === 0) {
    bankAccounts = [
      { name: "DANA", balance: 0 },
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

function saveBankAccounts() {
  localStorage.setItem("bankAccounts", JSON.stringify(bankAccounts));
}

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
  updatePaymentMethods();
  updateTransferAccountOptions();
}

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
  document.getElementById("bankAccount").value = "";
  document.getElementById("customBankGroup").style.display = "none";
}

function editBank(name) {
  const bank = bankAccounts.find((b) => b.name === name);
  if (bank) {
    document.getElementById("bankAccount").value = bank.name;
    document.getElementById("currentBalance").value = bank.balance;
    document.getElementById("customBankGroup").style.display = "none";
  }
}

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
    updateBankBalanceForTransaction(formData.fromAccount, -formData.amount);
    updateBankBalanceForTransaction(formData.toAccount, formData.amount);
  } else {
    const paymentMethod = document.getElementById("paymentMethod").value;
    if (!paymentMethod) {
      alert("Pilih metode pembayaran.");
      return;
    }
    formData.paymentMethod = paymentMethod;
    const multiplier = type === "income" ? 1 : -1;
    updateBankBalanceForTransaction(
      formData.paymentMethod,
      formData.amount * multiplier
    );
  }

  if (editingId) {
    const index = transactions.findIndex((t) => t.id === editingId);
    if (index !== -1) {
      const oldTransaction = transactions[index];
      if (oldTransaction.type === "transfer") {
        updateBankBalanceForTransaction(
          oldTransaction.fromAccount,
          oldTransaction.amount
        );
        updateBankBalanceForTransaction(
          oldTransaction.toAccount,
          -oldTransaction.amount
        );
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
    const transaction = {
      ...formData,
      id: Date.now().toString(),
    };
    transactions.push(transaction);
    alert("Transaksi berhasil ditambahkan!");
  }

  saveTransactions();
  saveBankAccounts();
  loadBankBalances();
  applyFilter();
  resetForm();
}

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

function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function resetForm() {
  document.getElementById("transactionForm").reset();
  document.getElementById("date").valueAsDate = new Date();
  document.getElementById("category").innerHTML =
    '<option value="">Pilih Kategori</option>';
  document.getElementById("transferGroup").style.display = "none";
  document.getElementById("paymentMethod").style.display = "block";
  document.querySelector('label[for="paymentMethod"]').style.display = "block";
  updatePaymentMethods();
  updateCategories();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

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

function toggleTransferFields() {
  const type = document.getElementById("type").value;
  const transferGroup = document.getElementById("transferGroup");
  const paymentMethod = document.getElementById("paymentMethod");
  const paymentMethodGroup = paymentMethod.closest(".input-group");

  if (type === "transfer") {
    transferGroup.style.display = "flex";
    paymentMethodGroup.style.display = "none";
    paymentMethod.removeAttribute("required");
    updateTransferAccountOptions();
  } else {
    transferGroup.style.display = "none";
    paymentMethodGroup.style.display = "block";
    paymentMethod.setAttribute("required", "required");
  }
}

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

function applyFilter() {
  currentFilter.startDate = document.getElementById("startDate").value;
  currentFilter.endDate = document.getElementById("endDate").value;
  currentFilter.month = document.getElementById("filterMonth").value;
  currentFilter.year = document.getElementById("filterYear").value;

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

  currentFilter.type = filterType;
  applyFilter();
}

function initializeFilterOptions() {
  const monthSelect = document.getElementById("filterMonth");
  const yearSelect = document.getElementById("filterYear");
  const currentYear = new Date().getFullYear();

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

  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    yearSelect.appendChild(option);
  }
}

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
    const amountCell = row.insertCell(4);
    amountCell.textContent = formatCurrency(transaction.amount);
    amountCell.style.color = getTransactionColor(transaction.type);
    amountCell.style.fontWeight = "bold";
  });

  const tableHeader = document.querySelector("#transactionTable thead tr");
  if (
    !tableHeader.querySelector("th:nth-child(5)").textContent.includes("Jumlah")
  ) {
    const amountHeader = document.createElement("th");
    amountHeader.textContent = "Jumlah";
    tableHeader.insertBefore(amountHeader, tableHeader.children[4]);
  }
}

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

function editTransaction(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (transaction) {
    editingId = id;
    document.getElementById("date").value = transaction.date;
    document.getElementById("type").value = transaction.type;
    updateCategories();
    document.getElementById("category").value = transaction.category;
    document.getElementById("amount").value = transaction.amount;
    document.getElementById("description").value = transaction.description;

    toggleTransferFields();

    if (transaction.type === "transfer") {
      document.getElementById("fromAccount").value = transaction.fromAccount;
      document.getElementById("toAccount").value = transaction.toAccount;
    } else {
      document.getElementById("paymentMethod").value =
        transaction.paymentMethod;
    }

    document.querySelector('button[type="submit"]').textContent =
      "💾 Update Transaksi";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function deleteTransaction(id) {
  if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
    const transactionToDelete = transactions.find((t) => t.id === id);
    if (transactionToDelete) {
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
        );
        updateBankBalanceForTransaction(
          transactionToDelete.toAccount,
          -transactionToDelete.amount
        );
      }
    }

    transactions = transactions.filter((t) => t.id !== id);
    saveTransactions();
    saveBankAccounts();
    loadBankBalances();
    applyFilter();
    alert("Transaksi berhasil dihapus!");
  }
}

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
    `"${(t.description || "").replace(/"/g, '""')}"`,
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
    initializeDefaultBanks();
    loadBankBalances();
    applyFilter();
    resetForm();
    alert("Semua data berhasil dihapus!");
  }
}

function resetFilter() {
  document.getElementById("filterType").value = "all";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("filterMonth").value = "";
  document.getElementById("filterYear").value = "";
  currentFilter = { type: "all" };
  toggleFilterOptions();
  alert("Filter berhasil direset!");
}

function downloadFilteredData() {
  downloadCSV();
}

function getTransactionColor(type) {
  return type === "income"
    ? "#27ae60"
    : type === "expense"
    ? "#e74c3c"
    : "#3498db";
}

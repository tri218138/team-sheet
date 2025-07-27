# Team Sheet

A simple static website for splitting group expenses, inspired by a Google Sheet.

## Features

- Dynamically add members and expense rows.
- Calculates who owes whom.
- Provides optimized transaction suggestions to minimize the number of payments.
- Export and import expense data as a JSON file.

## How to Use

1.  Open `index.html` in your browser.
2.  Set the number of members and their names.
3.  Add expense items, specifying the amount, who paid, and who used the service/product.
4.  Click "Tính toán" (Calculate) to see the summary and transaction suggestions.

## Project Structure
```
expense-splitter/
├── index.html
├── style/
│   └── main.css
├── script/
│   ├── main.js
│   ├── data.js
│   ├── logic.js
│   └── export.js
├── README.md
└── .nojekyll
```

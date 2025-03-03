Below is a detailed requirement document and a list of tasks with prompts to guide the development of a modern web-based application that retrieves OHLCV (Open, High, Low, Close, Volume) data from an SQLite3 database, displays it in charts, and includes a watchlist feature. The solution assumes a client-side application running entirely in the browser for simplicity, leveraging modern web technologies.

### Requirement Document

#### Project Title
Web-Based OHLCV Chart Viewer with Watchlist

#### Overview
This project aims to develop a modern web-based application that enables users to upload an SQLite3 database containing OHLCV data for various assets (e.g., stocks, cryptocurrencies) and visualize this data through interactive charts. The application will feature a watchlist where users can manage and monitor specific assets, with all functionality running client-side in the browser.

#### Functional Requirements
1. **Database Upload**
   - The application must provide an interface for users to upload an SQLite3 database file from their local machine.

2. **Data Retrieval**
   - The application must read OHLCV data from the uploaded database for specified assets.
   - The database is expected to follow this schema:
     - **Table: `assets`**
       - `asset_id` (text, primary key)
       - `asset_name` (text)
     - **Table: `ohlcv`**
       - `id` (integer, primary key)
       - `asset_id` (text, foreign key referencing `assets.asset_id`)
       - `timestamp` (integer, Unix timestamp)
       - `open` (real)
       - `high` (real)
       - `low` (real)
       - `close` (real)
       - `volume` (real)

3. **Chart Display**
   - The application must display OHLCV data in interactive candlestick charts with volume shown as histograms.

4. **Watchlist Management**
   - Users must be able to add or remove assets to/from a watchlist.
   - The watchlist must persist across sessions, stored in the browser's local storage.

5. **Asset Selection**
   - Users must be able to select an asset from the watchlist to view its OHLCV chart.

6. **Error Handling**
   - The application must handle errors (e.g., invalid database files, missing tables/columns) and display user-friendly error messages.

#### Non-Functional Requirements
1. **Technology Stack**
   - Use modern web technologies: HTML5, CSS3, JavaScript, and React for the frontend.
   - Use `sql.js` for SQLite3 database interactions in the browser via WebAssembly.
   - Use `@tradingview/lightweight-charts` for rendering financial charts.
   - Use Bootstrap for responsive styling.

2. **Performance**
   - The application should efficiently load and display data for reasonably sized datasets.

3. **User Interface**
   - The UI must be intuitive, responsive, and compatible with various screen sizes.
   - The design should be modern and user-friendly.

4. **Security**
   - As a client-side application, it should not execute untrusted code beyond the uploaded database processing.

#### Assumptions
- The SQLite3 database provided by the user adheres to the specified schema.
- The application is for single-user use, with no multi-user support or authentication required.
- The watchlist is stored in the browser’s local storage, independent of the database file.

#### Deliverables
- A fully functional web application meeting the above requirements.
- Source code with documentation and comments.
- A user guide explaining application usage.

---

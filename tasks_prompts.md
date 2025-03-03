### List of Tasks and AI Prompts

Below are the tasks required to build the application, along with specific prompts to provide to an AI assistant for generating the necessary code. in each of the steps if you adding a feature make sure you add tests to verify the same. 

#### Task 1: Set Up the Project Structure
**Description**: Initialize a React project and install required dependencies.
**Prompt**:
```
Create a new React application using Create React App. Install the following dependencies: sql.js, @tradingview/lightweight-charts, bootstrap. Set up the basic structure with a main App component.
```

#### Task 2: Implement Database Loading
**Description**: Create a component to upload and load the SQLite3 database into memory using `sql.js`, making it accessible across the app.
**Prompt**:
```
In a React application, create a component that allows the user to upload an SQLite3 database file. Use the File API to read the file and load it into sql.js. Store the loaded database in a React context so that it can be accessed from other components. Provide code for the context and the upload component.
```

#### Task 3: Create the Watchlist Feature
**Description**: Build the watchlist functionality to display, add, and remove assets, persisting the data in local storage.
**Sub-tasks and Prompts**:
1. **Retrieve Available Assets**
   **Prompt**:
   ```
   Using sql.js in a React application, write a function to query the 'assets' table and retrieve a list of all asset_ids and asset_names.
   ```
2. **Display and Manage Watchlist**
   **Prompt**:
   ```
   Create a React component that displays a list of assets in the watchlist. The watchlist should be stored in local storage. Provide functions to add and remove assets from the watchlist, updating local storage accordingly.
   ```
3. **Add Assets to Watchlist**
   **Prompt**:
   ```
   Implement a feature to add assets to the watchlist. Show a modal or a dropdown with all available assets not already in the watchlist, allowing the user to select and add them.
   ```

#### Task 4: Implement the Chart Display
**Description**: Create a chart component to display OHLCV data for a selected asset.
**Sub-tasks and Prompts**:
1. **Query OHLCV Data**
   **Prompt**:
   ```
   Write a function that, given an asset_id and the database object, queries the 'ohlcv' table for that asset's data, ordered by timestamp, and formats it into an array of objects with properties: time (timestamp), open, high, low, close, volume.
   ```
2. **Render the Chart**
   **Prompt**:
   ```
   Using the Lightweight Charts library in a React component, create a candlestick chart that displays OHLCV data. The component should accept an array of data points and display the candlestick chart with volume as a histogram below it.
   ```

#### Task 5: Handle User Interactions
**Description**: Enable interaction between the watchlist and chart by updating the displayed chart when an asset is selected.
**Prompt**:
```
In the watchlist component, add an onClick handler to each asset item that updates the currently selected asset in the state or context, triggering the chart component to display that asset's data.
```

#### Task 6: Add Error Handling
**Description**: Implement checks and user feedback for potential errors during database loading and querying.
**Prompt**:
```
Implement error handling for the database loading process. Check if the uploaded file is a valid SQLite3 database and if it contains the required 'assets' and 'ohlcv' tables. Display appropriate error messages to the user if there are issues.
```

#### Task 7: Style the Application
**Description**: Design a responsive, modern UI using Bootstrap.
**Prompt**:
```
Using Bootstrap in a React application, create a layout with a sidebar for the watchlist and a main area for the chart. Ensure the sidebar is collapsible on smaller screens and that the UI is responsive and modern.
```

---

### Additional Notes
- **Data Loading**: For simplicity, the application initially loads all OHLCV data for a selected asset. For large datasets, consider adding time range selection or pagination as an enhancement.
- **User Guide**: After development, create a simple guide explaining how to upload a database, manage the watchlist, and view charts.
- **Testing**: Test with a sample SQLite3 database matching the specified schema to ensure functionality.

This requirement document and task list provide a clear roadmap for building the application, with prompts tailored to leverage AI assistance effectively.
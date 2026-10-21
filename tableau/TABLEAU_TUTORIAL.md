# 📊 GridX Tableau Visualization Master Guide

Welcome to the **GridX Tableau Integration Suite**. This guide walks you through building 3 professional, interactive Tableau dashboards using the datasets exported directly from the GridX Big Data Lakehouse.

All ready-to-import CSV files are located in the [`tableau/`](file:///Users/sumitsinha/Documents/GridX/tableau) directory:

1. [`tableau_national_infrastructure.csv`](file:///Users/sumitsinha/Documents/GridX/tableau/tableau_national_infrastructure.csv) (63,949 critical facilities across Power, Telecom, Water, and Healthcare)
2. [`tableau_transmission_line_paths.csv`](file:///Users/sumitsinha/Documents/GridX/tableau/tableau_transmission_line_paths.csv) (5,000 transmission corridors with point-order for line mapping)
3. [`tableau_cascading_risk.csv`](file:///Users/sumitsinha/Documents/GridX/tableau/tableau_cascading_risk.csv) (70,000 power flow contingency scenarios with loading % and failure labels)
4. [`tableau_severe_weather_hazards.csv`](file:///Users/sumitsinha/Documents/GridX/tableau/tableau_severe_weather_hazards.csv) (15,000 extreme weather events from NOAA)

---

## 🗺️ Dashboard 1: Multi-Sector Infrastructure Geospatial Map

This dashboard plots national substations, cell towers, water treatment pumps, and hospitals on a live geospatial map.

### Step-by-Step Instructions:
1. Open **Tableau Desktop** or **Tableau Public**.
2. Click **Text file** under **Connect**, and choose [`tableau_national_infrastructure.csv`](file:///Users/sumitsinha/Documents/GridX/tableau/tableau_national_infrastructure.csv).
3. Go to **Sheet 1**:
   - Double-click **`Longitude`** (automatically placed in **Columns**).
   - Double-click **`Latitude`** (automatically placed in **Rows**).
   - Change the Mark type from *Automatic* to **Shape** (or **Circle**).
   - Drag **`Sector`** into **Color**:
     - ⚡ Power Grid: Orange / Gold
     - 📡 Telecommunications: Blue
     - 💧 Water Supply: Teal / Cyan
     - 🏥 Healthcare: Red
   - Drag **`facility_type`** into **Shape**.
   - Drag **`asset_name`**, **`capacity_metric`**, and **`backup_hours`** into **Tooltip**.
4. **Add Filters:**
   - Drag **`Sector`** to the **Filters** shelf (Show Filter $\rightarrow$ Multiple Values Dropdown).
   - Drag **`vulnerability_tier`** to **Filters** shelf (Allows toggling between Tier 1 primary nodes and general facilities).
5. **Rename the Sheet:** `National Multi-Sector Map`.

---

## ⚡ Dashboard 2: Cascading Failure & GNN Risk Matrix

This dashboard visualizes how increased electricity demand (heatwaves) triggers line overloads and secondary blackout cascades.

### Step-by-Step Instructions:
1. In Tableau, click **Data** $\rightarrow$ **New Data Source** $\rightarrow$ **Text file** $\rightarrow$ select [`tableau_cascading_risk.csv`](file:///Users/sumitsinha/Documents/GridX/tableau/tableau_cascading_risk.csv).
2. **Sheet 2A (Line Loading Heatmap):**
   - Drag **`line_id`** to **Rows** (ensure it is treated as a Dimension).
   - Drag **`stress_condition`** to **Columns**.
   - Drag **`loading_percent`** to **Color**.
   - Click **Color** $\rightarrow$ **Edit Colors...** $\rightarrow$ Choose **Red-Yellow-Green Diverging** and check **Reversed** (so >100% overload is bright Red, and <50% is Green).
   - Label the sheet: `Line Loading Heatmap`.
3. **Sheet 2B (Secondary Cascading Failure Rate):**
   - Drag **`stress_condition`** to **Columns**.
   - Drag **`label_failed`** to **Rows** (change aggregation to **Average**, format as **Percentage**).
   - Change Mark type to **Bar Chart**.
   - Label the sheet: `Secondary Trip Probability by Stress`.
4. **Combine into a Dashboard:**
   - Create a New Dashboard named `Cascading Failure Risk Analysis`.
   - Drag `Line Loading Heatmap` to the top half.
   - Drag `Secondary Trip Probability by Stress` to the bottom half.
   - Add a Title: **GridX: Real-Time Contingency Overload & GNN Prediction Matrix**.

---

## 🌪️ Dashboard 3: Severe Weather & Extreme Grid Hazard Impact

This dashboard illustrates 10 years of NOAA atmospheric storm events that trigger line disruptions.

### Step-by-Step Instructions:
1. In Tableau, click **Data** $\rightarrow$ **New Data Source** $\rightarrow$ **Text file** $\rightarrow$ select [`tableau_severe_weather_hazards.csv`](file:///Users/sumitsinha/Documents/GridX/tableau/tableau_severe_weather_hazards.csv).
2. **Sheet 3A (Storm Event Density Map):**
   - Drag **`Longitude`** to **Columns**, **`Latitude`** to **Rows**.
   - Change Mark type to **Density**.
   - Drag **`grid_hazard_level`** to **Weight**.
   - Notice the high-density storm corridors across the Midwest, Gulf Coast, and Eastern Interconnection.
3. **Sheet 3B (Property Damage vs. Hazard Intensity):**
   - Drag **`magnitude`** to **Columns**.
   - Drag **`damage_property_usd`** to **Rows**.
   - Drag **`event_type`** to **Color** (High Wind, Tornado, Hail, Winter Storm).
   - Set Mark type to **Circle**.
4. **Add Time Slider:**
   - Drag **`year`** to the **Pages** or **Filters** shelf to create an interactive 2015–2024 playback slider.

---

## 💡 Tableau Calculated Fields (Copy-Paste Formulas)

You can create these calculated fields in Tableau for richer analytical KPIs:

### 1. High-Confidence Risk Alarm Flag
```tableau
IF [loading_percent] >= 100.0 THEN "CRITICAL: Tripped / Cascade"
ELSEIF [loading_percent] >= 80.0 THEN "WARNING: Elevated Thermal Stress"
ELSE "NORMAL: Within Ampacity"
END
```

### 2. Immediate Water Deficit (GPM Loss)
```tableau
IF [Sector] = "Water Supply" AND [backup_hours] = 0.0 THEN 2500.0
ELSE 0.0
END
```

### 3. Emergency Backup Fuel Urgency
```tableau
IF [backup_hours] <= 4.0 THEN "Immediate Shutdown Risk (<4h)"
ELSEIF [backup_hours] <= 24.0 THEN "High Priority Refueling"
ELSE "Adequate Fuel Reserves (>24h)"
END
```

---

## 🚀 Presentation Pitch to Evaluator / Teacher

> *"For executive reporting and geospatial situational awareness, we integrated **Tableau** with our PySpark data lakehouse. We prepared four curated extracts that plot over 63,000 critical facilities across all four infrastructure sectors, render actual transmission line corridors, and display GNN overload risk matrices alongside 10 years of NOAA severe weather data.*
>
> *This allows grid dispatchers and city planners to visually trace how an extreme storm triggers line trips, and watch in real time how that power loss propagates to municipal booster pumps and cellular towers."*

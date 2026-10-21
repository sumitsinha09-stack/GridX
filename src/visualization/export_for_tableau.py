"""
GridX: Automated Tableau Export & Data Preparation Pipeline
Extracts, structures, and exports curated datasets specifically formatted for
Tableau Desktop / Tableau Public visualization:
1. Multi-Sector Infrastructure Map (Substations, Cell Towers, Water Nodes, Hospitals)
2. Dual-Axis Transmission Line Geographic Corridors (Path order for Tableau Line marks)
3. Cascading Failure Contingency & Loading Risk Matrix
4. Severe Weather Hazard & Grid Disruption Corpus
"""

import os
import sys
import glob
import pandas as pd
import numpy as np

# Ensure project root in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

OUTPUT_DIR = "tableau"

def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Ensured Tableau export directory: {OUTPUT_DIR}/")

def export_unified_infrastructure(sample_size=30000):
    """
    Creates a unified multi-sector geospatial dataset for Tableau maps.
    Combines Power, Telecom, Water, and Healthcare into a single tabular view
    with standardized Latitude, Longitude, Sector, and Criticality columns.
    """
    print("\n[1/4] Generating Unified Multi-Sector Infrastructure for Tableau...")
    records = []

    # 1. Substations (Power)
    sub_path = "data/raw_large/national_infra/national_substations.csv"
    if os.path.exists(sub_path):
        df_sub = pd.read_csv(sub_path)
        for _, r in df_sub.iterrows():
            records.append({
                "asset_id": r["substation_id"],
                "asset_name": r["name"],
                "sector": "Power Grid",
                "facility_type": "Substation",
                "latitude": float(r["latitude"]),
                "longitude": float(r["longitude"]),
                "capacity_metric": f"{r['voltage_kv']} kV ({r['max_capacity_mva']} MVA)",
                "backup_hours": 999.0, # Source of power
                "is_critical": bool(r.get("scada_enabled", True)),
                "region": str(r.get("rto_balancing_authority", "Regional Grid")),
                "vulnerability_tier": "Tier 1 - Primary Node" if r["voltage_kv"] >= 230 else "Tier 2 - Distribution Node"
            })
        print(f"  • Processed {len(df_sub):,} Substations")

    # 2. Cell Towers (Telecom)
    tow_path = "data/raw_large/national_infra/national_cell_towers.csv"
    if os.path.exists(tow_path):
        df_tow = pd.read_csv(tow_path)
        # Sample to keep Tableau responsive and clean
        df_tow_sample = df_tow.sample(n=min(len(df_tow), sample_size // 2), random_state=42)
        for _, r in df_tow_sample.iterrows():
            records.append({
                "asset_id": r["tower_id"],
                "asset_name": f"{r['carrier']} Base Station",
                "sector": "Telecommunications",
                "facility_type": "Cell Tower",
                "latitude": float(r["latitude"]),
                "longitude": float(r["longitude"]),
                "capacity_metric": f"{r['structure_height_m']}m Height",
                "backup_hours": float(r["battery_backup_hours"]),
                "is_critical": bool(r.get("provides_grid_scada", False)),
                "region": str(r.get("region_hub", "Regional Hub")),
                "vulnerability_tier": "Low Backup (<=4h)" if r["battery_backup_hours"] <= 4.0 else "Standard Backup (>4h)"
            })
        print(f"  • Processed {len(df_tow_sample):,} Cell Towers (Sampled from {len(df_tow):,})")

    # 3. Water Facilities (Water)
    wtr_path = "data/raw_large/national_infra/national_water_facilities.csv"
    if os.path.exists(wtr_path):
        df_wtr = pd.read_csv(wtr_path)
        df_wtr_sample = df_wtr.sample(n=min(len(df_wtr), 8000), random_state=42)
        for _, r in df_wtr_sample.iterrows():
            is_pump = bool(r.get("is_pump", True))
            records.append({
                "asset_id": r["facility_id"],
                "asset_name": r["name"],
                "sector": "Water Supply",
                "facility_type": "Booster Pump" if is_pump else "Storage Reservoir",
                "latitude": float(r["latitude"]),
                "longitude": float(r["longitude"]),
                "capacity_metric": f"{r['flow_capacity_gpm']} GPM ({r['rated_power_kw']} kW)",
                "backup_hours": float(r.get("backup_hours", 0.0)),
                "is_critical": is_pump,
                "region": "Municipal Water Network",
                "vulnerability_tier": "Immediate Failure (0h)" if is_pump else "Passive Storage"
            })
        print(f"  • Processed {len(df_wtr_sample):,} Water Facilities")

    # 4. Hospitals (Healthcare)
    hsp_path = "data/raw_large/national_infra/national_hospitals.csv"
    if os.path.exists(hsp_path):
        df_hsp = pd.read_csv(hsp_path)
        for _, r in df_hsp.iterrows():
            is_trauma = bool(r.get("critical_trauma_center", False))
            records.append({
                "asset_id": r["hospital_id"],
                "asset_name": r["name"],
                "sector": "Healthcare",
                "facility_type": "Trauma Center" if is_trauma else "Acute Care Hospital",
                "latitude": float(r["latitude"]),
                "longitude": float(r["longitude"]),
                "capacity_metric": f"{r['staffed_beds']} Beds ({r['icu_beds']} ICU)",
                "backup_hours": float(r["generator_fuel_hours"]),
                "is_critical": is_trauma or (r["icu_beds"] >= 30),
                "region": "Public Health District",
                "vulnerability_tier": "Critical ICU Center" if r["icu_beds"] >= 30 else "General Hospital"
            })
        print(f"  • Processed {len(df_hsp):,} Hospitals")

    unified_df = pd.DataFrame(records)
    out_file = os.path.join(OUTPUT_DIR, "tableau_national_infrastructure.csv")
    unified_df.to_csv(out_file, index=False)
    print(f"  -> Exported {len(unified_df):,} assets to {out_file} (Size: {os.path.getsize(out_file)/1024/1024:.2f} MB)")

def export_transmission_line_paths(sample_lines=5000):
    """
    Creates a geographic line-path dataset so Tableau can render actual
    transmission line vectors between substations using Tableau's 'Line' mark type.
    """
    print("\n[2/4] Generating Transmission Line Corridors for Tableau Line Maps...")
    lines_path = "data/raw_large/national_infra/national_transmission_lines.csv"
    subs_path = "data/raw_large/national_infra/national_substations.csv"
    
    if not (os.path.exists(lines_path) and os.path.exists(subs_path)):
        print("  ! Missing transmission line or substation files.")
        return

    df_lines = pd.read_csv(lines_path).sample(n=min(5000, sample_lines), random_state=42)
    df_subs = pd.read_csv(subs_path).set_index("substation_id")

    line_records = []
    for _, l in df_lines.iterrows():
        u = l["from_substation"]
        v = l["to_substation"]
        if u in df_subs.index and v in df_subs.index:
            sub_u = df_subs.loc[u]
            sub_v = df_subs.loc[v]
            
            # Point 1 (Origin)
            line_records.append({
                "line_id": l["line_id"],
                "voltage_kv": l["voltage_kv"],
                "length_km": l["length_km"],
                "thermal_rating_mva": l["thermal_rating_mva"],
                "point_order": 1,
                "substation_id": u,
                "latitude": float(sub_u["latitude"]),
                "longitude": float(sub_u["longitude"])
            })
            # Point 2 (Destination)
            line_records.append({
                "line_id": l["line_id"],
                "voltage_kv": l["voltage_kv"],
                "length_km": l["length_km"],
                "thermal_rating_mva": l["thermal_rating_mva"],
                "point_order": 2,
                "substation_id": v,
                "latitude": float(sub_v["latitude"]),
                "longitude": float(sub_v["longitude"])
            })

    out_df = pd.DataFrame(line_records)
    out_file = os.path.join(OUTPUT_DIR, "tableau_transmission_line_paths.csv")
    out_df.to_csv(out_file, index=False)
    print(f"  -> Exported {len(out_df)//2:,} transmission circuits ({len(out_df):,} waypoints) to {out_file}")

def export_cascading_contingencies():
    """
    Exports a curated cascading failure risk dataset with loading percentages,
    demand stress levels, and ground-truth failure labels.
    """
    print("\n[3/4] Generating Cascading Contingency Risk Matrix for Tableau...")
    raw_csv = "cascading_failures_dataset.csv"
    if not os.path.exists(raw_csv):
        print("  ! cascading_failures_dataset.csv not found.")
        return

    df = pd.read_csv(raw_csv)
    
    # Categorize loading risk
    def categorize_risk(lp):
        if lp >= 100.0:
            return "Critical Overload (>=100%)"
        elif lp >= 80.0:
            return "Elevated Stress (80-100%)"
        elif lp >= 50.0:
            return "Moderate Loading (50-80%)"
        else:
            return "Nominal (<50%)"

    df["risk_category"] = df["loading_percent"].apply(categorize_risk)
    df["failure_status"] = df["label_failed"].apply(lambda x: "Secondary Trip / Cascade" if x == 1 else "Surviving Circuit")
    df["stress_condition"] = df["demand_multiplier"].apply(
        lambda m: "Extreme Heatwave (1.4x-1.8x)" if m >= 1.4 else ("Elevated Load (1.1x-1.4x)" if m >= 1.1 else "Base Nominal (1.0x)")
    )

    out_file = os.path.join(OUTPUT_DIR, "tableau_cascading_risk.csv")
    df.to_csv(out_file, index=False)
    print(f"  -> Exported {len(df):,} scenario records to {out_file}")

def export_severe_weather_hazards():
    """
    Exports curated NOAA storm and extreme hazard records for Tableau.
    """
    print("\n[4/4] Generating Severe Weather & Storm Corpus for Tableau...")
    storms_parquet = "data/processed/clean_noaa_storms.parquet"
    if os.path.exists(storms_parquet):
        import pyarrow.parquet as pq
        table = pq.read_table(storms_parquet)
        df_storms = table.to_pandas()
        
        # Select key columns and sample if large
        selected_cols = [
            "event_id", "year", "event_type", "magnitude", 
            "damage_property_usd", "latitude", "longitude", "grid_hazard_level"
        ]
        available_cols = [c for c in selected_cols if c in df_storms.columns]
        df_sample = df_storms[available_cols].sample(n=min(len(df_storms), 15000), random_state=42)
        
        out_file = os.path.join(OUTPUT_DIR, "tableau_severe_weather_hazards.csv")
        df_sample.to_csv(out_file, index=False)
        print(f"  -> Exported {len(df_sample):,} storm hazard records to {out_file}")
    else:
        print("  ! clean_noaa_storms.parquet not found, skipping weather extract.")

def main():
    print("=" * 70)
    print("⚡ GRIDX AUTOMATED TABLEAU EXPORT SUITE")
    print("=" * 70)
    ensure_output_dir()
    export_unified_infrastructure()
    export_transmission_line_paths()
    export_cascading_contingencies()
    export_severe_weather_hazards()
    print("\n" + "=" * 70)
    print(f"All Tableau datasets generated in '{OUTPUT_DIR}/' folder!")
    print("=" * 70)

if __name__ == "__main__":
    main()

"""
Grid Loader Module.

Responsible for loading benchmark IEEE standard power grid systems
(IEEE 39-bus New England, IEEE 118-bus, IEEE 300-bus) using pandapower networks.
"""

from typing import List, Optional
import pandapower as pp
import pandapower.networks as nw


SUPPORTED_NETWORKS = {
    "ieee39": nw.case39,
    "ieee118": nw.case118,
    "ieee300": nw.case300,
}


def list_available_grids() -> List[str]:
    """
    Returns a list of supported IEEE grid system identifiers.
    """
    return list(SUPPORTED_NETWORKS.keys())


def load_grid(grid_name: str = "ieee39") -> pp.pandapowerNet:
    """
    Load an IEEE standard power system case by name.

    Args:
        grid_name: Key of the network to load (e.g. 'ieee39', 'ieee118', 'ieee300').

    Returns:
        pp.pandapowerNet: pandapower network instance initialized with baseline state.
    """
    grid_name_clean = grid_name.lower().replace("-", "").replace("_", "")
    if grid_name_clean not in SUPPORTED_NETWORKS:
        raise ValueError(
            f"Unsupported grid '{grid_name}'. Supported options: {list(SUPPORTED_NETWORKS.keys())}"
        )
    
    net_func = SUPPORTED_NETWORKS[grid_name_clean]
    net = net_func()
    
    # Run initial power flow to ensure validity
    pp.runpp(net)
    return net

import re

_convergence_start_expr = r"\s+\-+\|Geometry convergence\|\-+"

_nrg_cng_expr = r"\s+Energy change\s+(?P<nrg_cng>\-?\d+\.\d+)\s+(?P<nrg_cng_thresh>\-?\d+\.\d+)\s+(?P<nrg_cng_conv>YES|NO)"

_rms_grad_expr = r"\s+RMS gradient\s+(?P<rms_grad>\-?\d+\.\d+)\s+(?P<rms_grad_thresh>\-?\d+\.\d+)\s+(?P<rms_grad_conv>YES|NO)"

_max_grad_expr = r"\s+MAX gradient\s+(?P<max_grad>\-?\d+\.\d+)\s+(?P<max_grad_thresh>\-?\d+\.\d+)\s+(?P<max_grad_conv>YES|NO)"

_rms_step_expr = r"\s+RMS step\s+(?P<rms_step>\-?\d+\.\d+)\s+(?P<rms_step_thresh>\-?\d+\.\d+)\s+(?P<rms_step_conv>YES|NO)"

_max_step_expr = r"\s+MAX step\s+(?P<max_step>\-?\d+\.\d+)\s+(?P<max_step_thresh>\-?\d+\.\d+)\s+(?P<max_step_conv>YES|NO)"

_total_energy_start_expr = r"TOTAL SCF ENERGY"

_total_energy_expr = r"Total Energy\s+:\s+(?P<ttl_nrg>\-?\d+\.\d+) Eh\s+(?P<ttl_ev>\-?\d+\.\d+) eV"

_coordinate_start_expr = r"CARTESIAN COORDINATES \(ANGSTROEM\)"

_coordinate_end_expr = r"CARTESIAN COORDINATES \(A\.U\.\)"

_coordiante_expr = r"\s+(?P<atomic_symbol>[A-Z][a-z]?)\s+(?P<x_coord>\-?\d+\.\d+)\s+(?P<y_coord>\-?\d+\.\d+)\s+(?P<z_coord>\-?\d+\.\d+)"

_start_patterns = {
    "conv_start_t": _convergence_start_expr,
    "coordinate_start_t": _coordinate_start_expr,
    "ttl_nrg_start_t": _total_energy_start_expr,
}
_conv_patterns = {
    "nrg_cng_t": _nrg_cng_expr,
    "rms_grad_t": _rms_grad_expr,
    "max_grad_t": _max_grad_expr,
    "rms_step_t": _rms_step_expr,
    "max_step_t": _max_step_expr,
}

_coord_patterns = {
    "coordinate_t": _coordiante_expr,
    "coordinate_end_t": _coordinate_end_expr,
}

_total_energy_patterns = {
    "ttl_nrg_t": _total_energy_expr,
}


class OrcaPatterns:
    def __init__(self) -> None:
        self.start_patterns: re.Pattern[str] = re.compile(
            "|".join(f"(?P<{name}>{pat})" for name, pat in _start_patterns.items()),
            re.DOTALL,
        )

        self.convergence_patterns: re.Pattern[str] = re.compile(
            "|".join(f"(?P<{name}>{pat})" for name, pat in _conv_patterns.items()),
            re.DOTALL,
        )

        self.energy_patterns: re.Pattern[str] = re.compile(
            "|".join(f"(?P<{name}>{pat})" for name, pat in _total_energy_patterns.items()),
            re.DOTALL,
        )

        self.coordinate_patterns: re.Pattern[str] = re.compile(
            "|".join(f"(?P<{name}>{pat})" for name, pat in _coord_patterns.items()),
            re.DOTALL,
        )


def get_patterns() -> OrcaPatterns:
    return OrcaPatterns()

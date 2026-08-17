from dataclasses import dataclass


@dataclass
class GeometryConvergence:
    energy_change: float
    energy_change_threshold: float
    energy_change_converged: bool
    rms_grad: float
    rms_grad_threshold: float
    rms_grad_converged: bool
    max_grad: float
    max_grad_threshold: float
    max_grad_converged: bool
    rms_step: float
    rms_step_threshold: float
    rms_step_converged: bool
    max_step: float
    max_step_threshold: float
    max_step_converged: float


@dataclass
class TotalEnergy:
    total_energy: float
    total_ev: float


@dataclass
class AtomCoordinate:
    atomic_symbol: str
    x_coord: float
    y_coord: float
    z_coord: float


class TotalEnergyBuilder:
    def __init__(self):
        self.total_energy: float = 0.0
        self.total_ev: float = 0.0

    def set_total_energy(self, total_energy: float) -> "TotalEnergyBuilder":
        self.total_energy = total_energy
        return self

    def set_total_ev(self, total_ev: float) -> "TotalEnergyBuilder":
        self.total_ev = total_ev
        return self

    def build(self) -> TotalEnergy:
        return TotalEnergy(self.total_energy, self.total_ev)

    def reset(self) -> "TotalEnergyBuilder":
        self.total_energy = 0.0
        self.total_ev = 0.0
        return self


class GeometryBuilder:
    def __init__(self):
        self.geometry = []

    def append_coordinate(self, symbol: str, x: float, y: float, z: float) -> "GeometryBuilder":
        self.geometry.append(AtomCoordinate(symbol, x, y, z))
        return self

    def build(self) -> list[AtomCoordinate]:
        return list(self.geometry)

    def reset(self) -> "GeometryBuilder":
        self.geometry = []
        return self


class GeometryConvergenceBuilder:
    def __init__(self):
        self._initialize()

    def reset(self) -> "GeometryConvergenceBuilder":
        self._initialize()
        return self

    def build(self) -> GeometryConvergence:
        return GeometryConvergence(
            self.energy_change,
            self.energy_change_threshold,
            self.energy_change_converged,
            self.rms_grad,
            self.rms_grad_threshold,
            self.rms_grad_converged,
            self.max_grad,
            self.max_grad_threshold,
            self.max_grad_converged,
            self.rms_step,
            self.rms_step_threshold,
            self.rms_step_converged,
            self.max_step,
            self.max_step_threshold,
            self.max_step_converged,
        )

    def set_energy_change(self, energy_change: float) -> "GeometryConvergenceBuilder":
        self.energy_change = energy_change
        return self

    def set_energy_change_threshold(
        self, energy_change_threshold: float
    ) -> "GeometryConvergenceBuilder":
        self.energy_change_threshold = energy_change_threshold
        return self

    def set_energy_change_converged(
        self, energy_change_converged: bool
    ) -> "GeometryConvergenceBuilder":
        self.energy_change_converged = energy_change_converged
        return self

    def set_rms_grad(self, rms_grad: float) -> "GeometryConvergenceBuilder":
        self.rms_grad = rms_grad
        return self

    def set_rms_grad_threshold(self, rms_grad_threshold: float) -> "GeometryConvergenceBuilder":
        self.rms_grad_threshold = rms_grad_threshold
        return self

    def set_rms_grad_converged(self, rms_grad_converged: bool) -> "GeometryConvergenceBuilder":
        self.rms_grad_converged = rms_grad_converged
        return self

    def set_max_grad(self, max_grad: float) -> "GeometryConvergenceBuilder":
        self.max_grad = max_grad
        return self

    def set_max_grad_threshold(self, max_grad_threshold: float) -> "GeometryConvergenceBuilder":
        self.max_grad_threshold = max_grad_threshold
        return self

    def set_max_grad_converged(self, max_grad_converged: bool) -> "GeometryConvergenceBuilder":
        self.max_grad_converged = max_grad_converged
        return self

    def set_rms_step(self, rms_step: float) -> "GeometryConvergenceBuilder":
        self.rms_step = rms_step
        return self

    def set_rms_step_threshold(self, rms_step_threshold: float) -> "GeometryConvergenceBuilder":
        self.rms_step_threshold = rms_step_threshold
        return self

    def set_rms_step_converged(self, rms_step_converged: bool) -> "GeometryConvergenceBuilder":
        self.rms_step_converged = rms_step_converged
        return self

    def set_max_step(self, max_step: float) -> "GeometryConvergenceBuilder":
        self.max_step = max_step
        return self

    def set_max_step_threshold(self, max_step_threshold: float) -> "GeometryConvergenceBuilder":
        self.max_step_threshold = max_step_threshold
        return self

    def set_max_step_converged(self, max_step_converged: float) -> "GeometryConvergenceBuilder":
        self.max_step_converged = max_step_converged
        return self

    def _initialize(self):
        self.energy_change: float = 0.0
        self.energy_change_threshold: float = 0.0
        self.energy_change_converged: bool = False
        self.rms_grad: float = 0.0
        self.rms_grad_threshold: float = 0.0
        self.rms_grad_converged: bool = False
        self.max_grad: float = 0.0
        self.max_grad_threshold: float = 0.0
        self.max_grad_converged: bool = False
        self.rms_step: float = 0.0
        self.rms_step_threshold: float = 0.0
        self.rms_step_converged: bool = False
        self.max_step: float = 0.0
        self.max_step_threshold: float = 0.0
        self.max_step_converged: float = 0.0

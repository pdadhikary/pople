from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import override

from orca.models import AtomCoordinate, GeometryConvergence, TotalEnergy

from .models import GeometryBuilder, GeometryConvergenceBuilder, TotalEnergyBuilder
from .patterns import get_patterns


class OrcaParser:
    def __init__(self):
        self.state: OrcaParserState = NormalState(self)
        self.patterns = get_patterns()
        self.geometry_builder = GeometryBuilder()
        self.convergence_bulder = GeometryConvergenceBuilder()
        self.energy_builder = TotalEnergyBuilder()

        self.geometry_subscribers: list[Callable[[list[AtomCoordinate]], None]] = []
        self.convergence_subscribers: list[Callable[[GeometryConvergence], None]] = []
        self.energy_subscribers: list[Callable[[TotalEnergy], None]] = []

    def parse(self, line: str):
        self.state.parse(line)

    def _set_state(self, state: "OrcaParserState"):
        self.state = state

    def _get_state(self) -> "OrcaParserState":
        return self.state

    def _handle_geometry_dispatch(self) -> None:
        geometry = self.geometry_builder.build()
        for subscribers in self.geometry_subscribers:
            subscribers(geometry)
        self.geometry_builder.reset()

    def _handle_convergence_dispatch(self) -> None:
        convergence = self.convergence_bulder.build()
        for subscribers in self.convergence_subscribers:
            subscribers(convergence)
        self.convergence_bulder.reset()

    def _handle_energy_dispatch(self) -> None:
        energy = self.energy_builder.build()
        for subscribers in self.energy_subscribers:
            subscribers(energy)
        self.energy_builder.reset()

    def register_geometry_updates(self, subscriber: Callable[[list[AtomCoordinate]], None]):
        self.geometry_subscribers.append(subscriber)

    def register_convergence_updates(self, subscriber: Callable[[GeometryConvergence], None]):
        self.convergence_subscribers.append(subscriber)

    def register_energy_updates(self, subscriber: Callable[[TotalEnergy], None]):
        self.energy_subscribers.append(subscriber)


class OrcaParserState(ABC):
    @abstractmethod
    def parse(self, line: str):
        pass


class NormalState(OrcaParserState):
    def __init__(self, parser: OrcaParser):
        self.parser = parser

    @override
    def parse(self, line: str):
        match_token = self.parser.patterns.start_patterns.match(line)
        if match_token is None:
            return
        group = match_token.lastgroup
        match group:
            case "conv_start_t":
                print("Changed to convergence state")
                self.parser._set_state(ConvergenceState(self.parser))
            case "coordinate_start_t":
                self.parser._set_state(CoordinateState(self.parser))
            case "ttl_nrg_start_t":
                self.parser._set_state(EnergyState(self.parser))
            case _:
                raise ValueError(f'Unexpected token group "{group}"')


class ConvergenceState(OrcaParserState):
    def __init__(self, parser: OrcaParser):
        self.parser = parser

    @override
    def parse(self, line: str):
        match_token = self.parser.patterns.convergence_patterns.match(line)
        if match_token is None:
            return
        group = match_token.lastgroup
        token_dict = match_token.groupdict()
        match group:
            case "nrg_cng_t":
                self.parser.convergence_bulder.set_energy_change(
                    float(token_dict["nrg_cng"])
                ).set_energy_change_threshold(
                    float(token_dict["nrg_cng_thresh"])
                ).set_energy_change_converged(token_dict["nrg_cng_conv"] == "YES")
            case "rms_grad_t":
                self.parser.convergence_bulder.set_rms_grad(
                    float(token_dict["rms_grad"])
                ).set_rms_grad_threshold(
                    float(token_dict["rms_grad_thresh"])
                ).set_rms_grad_converged(token_dict["rms_grad_conv"] == "YES")
            case "max_grad_t":
                self.parser.convergence_bulder.set_max_grad(
                    float(token_dict["max_grad"])
                ).set_max_grad_threshold(
                    float(token_dict["max_grad_thresh"])
                ).set_max_grad_converged(token_dict["max_grad_conv"] == "YES")
            case "rms_step_t":
                self.parser.convergence_bulder.set_rms_step(
                    float(token_dict["rms_step"])
                ).set_rms_step_threshold(
                    float(token_dict["rms_step_thresh"])
                ).set_rms_step_converged(token_dict["rms_step_conv"] == "YES")
            case "max_step_t":
                self.parser.convergence_bulder.set_max_step(
                    float(token_dict["max_step"])
                ).set_max_step_threshold(
                    float(token_dict["max_step_thresh"])
                ).set_max_step_converged(token_dict["max_step_conv"] == "YES")

                self.parser._handle_convergence_dispatch()
                self.parser._set_state(NormalState(self.parser))
            case _:
                raise ValueError(f'Unexpected token group "{group}"')


class CoordinateState(OrcaParserState):
    def __init__(self, parser: OrcaParser):
        self.parser = parser

    @override
    def parse(self, line: str):
        match_token = self.parser.patterns.coordinate_patterns.match(line)
        if match_token is None:
            return
        group = match_token.lastgroup
        token_dict = match_token.groupdict()
        match group:
            case "coordinate_t":
                self.parser.geometry_builder.append_coordinate(
                    token_dict["atomic_symbol"],
                    float(token_dict["x_coord"]),
                    float(token_dict["y_coord"]),
                    float(token_dict["z_coord"]),
                )
            case "coordinate_end_t":
                self.parser._handle_geometry_dispatch()
                self.parser._set_state(NormalState(self.parser))
            case _:
                raise ValueError(f'Unexpected token group "{group}"')


class EnergyState(OrcaParserState):
    def __init__(self, parser: OrcaParser):
        self.parser = parser

    @override
    def parse(self, line: str):
        match_token = self.parser.patterns.energy_patterns.match(line)
        if match_token is None:
            return
        group = match_token.lastgroup
        token_dict = match_token.groupdict()
        match group:
            case "ttl_nrg_t":
                self.parser.energy_builder.set_total_energy(
                    float(token_dict["ttl_nrg"])
                ).set_total_ev(float(token_dict["ttl_ev"]))

                self.parser._handle_energy_dispatch()
                self.parser._set_state(NormalState(self.parser))
            case _:
                raise ValueError(f'Unexpected token group "{group}"')

import pytest

from orca.parser import (
    ConvergenceState,
    CoordinateState,
    EnergyState,
    NormalState,
    OrcaParser,
)
from orca.patterns import OrcaPatterns, get_patterns


@pytest.fixture
def patterns():
    return get_patterns()


@pytest.fixture
def parser():
    return OrcaParser()


@pytest.mark.parametrize(
    "text, expected",
    [
        (
            """          ----------------------|Geometry convergence|-------------------------""",
            "conv_start_t",
        ),
        ("""CARTESIAN COORDINATES (ANGSTROEM)""", "coordinate_start_t"),
        ("""TOTAL SCF ENERGY""", "ttl_nrg_start_t"),
    ],
)
def test_start_patterns(patterns: OrcaPatterns, text: str, expected: str):
    match = patterns.start_patterns.match(text)
    assert match is not None
    assert match.lastgroup == expected


@pytest.mark.parametrize(
    "text, expected",
    [
        (
            """    Energy change      -0.0000145308            0.0000050000      NO""",
            "nrg_cng_t",
        ),
        (
            """    Energy change      -0.0000145308            0.0000050000     YES""",
            "nrg_cng_t",
        ),
        (
            """    Energy change       0.0000145308           -0.0000050000     YES""",
            "nrg_cng_t",
        ),
        (
            """    RMS gradient        0.0001920253            0.0001000000      NO""",
            "rms_grad_t",
        ),
        (
            """    RMS gradient       -0.0001920253           -0.0001000000     YES""",
            "rms_grad_t",
        ),
        (
            """    MAX gradient        0.0029890605            0.0003000000      NO""",
            "max_grad_t",
        ),
        (
            """    MAX gradient        0.0029890605           -0.0003000000     YES""",
            "max_grad_t",
        ),
        (
            """    RMS step            0.0126660099          110.0020000000     YES""",
            "rms_step_t",
        ),
        (
            """    MAX step            0.0232628881            0.0040000000      NO""",
            "max_step_t",
        ),
        (
            """    MAX step           10.0232628881            0.0040000000     YES""",
            "max_step_t",
        ),
    ],
)
def test_conv_patterns(patterns: OrcaPatterns, text: str, expected: str):
    match = patterns.convergence_patterns.match(text)
    assert match is not None
    assert match.lastgroup == expected


@pytest.mark.parametrize(
    "text, expected",
    [
        (
            """Total Energy       :      -1398.71923350439874 Eh          -38061.08533 eV""",
            "ttl_nrg_t",
        ),
        (
            """Total Energy       :       1398.71923350439874 Eh           38061.08533 eV""",
            "ttl_nrg_t",
        ),
        (
            """Total Energy       :       1398.71923350439874 Eh             -61.08533 eV""",
            "ttl_nrg_t",
        ),
        (
            """Total Energy       :      -98.71923350439874 Eh                -1.08533 eV""",
            "ttl_nrg_t",
        ),
    ],
)
def test_energy_patterns(patterns: OrcaPatterns, text: str, expected: str):
    match = patterns.energy_patterns.match(text)
    assert match is not None
    assert match.lastgroup == expected


@pytest.mark.parametrize(
    "text, expected",
    [
        ("""  C     -3.461638    1.611498   -0.083559""", "coordinate_t"),
        ("""  S     -2.181242    2.136821   -0.127191""", "coordinate_t"),
        ("""  He    -1.046625    1.312571   -0.288008""", "coordinate_t"),
        ("""  Pt    -1.274833   -0.079193   -0.443848""", "coordinate_t"),
        ("""  P     -2.566199   -0.605110   -0.421017""", "coordinate_t"),
        ("""  B     -3.674649    0.234787   -0.238609""", "coordinate_t"),
        ("""  H     -4.301693    2.272624    0.086978""", "coordinate_t"),
        ("""  H     -2.098283    3.208949    0.000486""", "coordinate_t"),
        ("""  H     -0.449088   -0.769725   -0.547015""", "coordinate_t"),
        ("""  H     -2.690592   -1.669007   -0.531769""", "coordinate_t"),
        ("""  C      1.467904    1.012854   -0.280744""", "coordinate_t"),
        ("""  C      0.581559    3.234885    0.022756""", "coordinate_t"),
        ("""  O      0.348856    1.852853   -0.204140""", "coordinate_t"),
        ("""  C      2.759953    1.514210   -0.139247""", "coordinate_t"),
        ("""  H      1.347896   -0.048744   -0.449026""", "coordinate_t"),
        ("""  C      1.870972    3.728739    0.164206""", "coordinate_t"),
        ("""  H     -0.256786    3.911549    0.121059""", "coordinate_t"),
        ("""  C      2.969929    2.871931    0.084503""", "coordinate_t"),
        ("""  H      3.603421    0.835738   -0.201525""", "coordinate_t"),
        ("""  H      2.019077    4.787683    0.344796""", "coordinate_t"),
        ("""  H      3.976120    3.259401    0.197528""", "coordinate_t"),
        ("""  C     -5.083646   -0.248967   -0.158596""", "coordinate_t"),
        ("""  O     -6.063591    0.388067    0.059288""", "coordinate_t"),
        ("""  Cl    -5.291358   -2.060347   -0.474060""", "coordinate_t"),
        ("""  C     -3.548986   -1.638932    2.753868""", "coordinate_t"),
        ("""  C     -2.221078   -1.201029    2.759306""", "coordinate_t"),
        ("""  C     -1.983014    0.181224    2.965900""", "coordinate_t"),
        ("""  C     -3.079864    1.019587    3.197030""", "coordinate_t"),
        ("""  C     -4.355483    0.462864    3.178898""", "coordinate_t"),
        ("""  H     -3.764212   -2.689426    2.565424""", "coordinate_t"),
        ("""  H     -2.965831    2.079984    3.375776""", "coordinate_t"),
        ("""  H     -5.220836    1.101113    3.329620""", "coordinate_t"),
        ("""  N     -4.612339   -0.846850    2.951349""", "coordinate_t"),
        ("""  H     -1.407213   -1.883090    2.577109""", "coordinate_t"),
        ("""  O     -0.681896    0.596876    2.904844""", "coordinate_t"),
        ("""  C     -0.421683    1.984350    3.169537""", "coordinate_t"),
        ("""  H      0.661656    2.070299    3.104330""", "coordinate_t"),
        ("""  H     -0.883362    2.597014    2.414749""", "coordinate_t"),
        ("""  H     -0.745627    2.300629    4.164665""", "coordinate_t"),
        ("""CARTESIAN COORDINATES (A.U.)""", "coordinate_end_t"),
    ],
)
def test_coordinate_patterns(patterns: OrcaPatterns, text: str, expected: str):
    match = patterns.coordinate_patterns.match(text)
    assert match is not None
    assert match.lastgroup == expected


def test_parser_normal_coordinate(parser: OrcaParser):
    assert isinstance(parser.state, NormalState)

    line = "CARTESIAN COORDINATES (ANGSTROEM)"
    parser.parse(line)

    assert isinstance(parser.state, CoordinateState)

    line = "CARTESIAN COORDINATES (A.U.)"
    parser.parse(line)

    assert isinstance(parser.state, NormalState)


def test_parser_normal_convergence(parser: OrcaParser):
    assert isinstance(parser.state, NormalState)

    line = "          ----------------------|Geometry convergence|-------------------------"
    parser.parse(line)

    assert isinstance(parser.state, ConvergenceState)

    line = "          MAX step            0.0232628881            0.0040000000      NO"
    parser.parse(line)

    assert isinstance(parser.state, NormalState)


def test_parser_normal_enerygy(parser: OrcaParser):
    assert isinstance(parser.state, NormalState)

    line = "TOTAL SCF ENERGY"
    parser.parse(line)

    assert isinstance(parser.state, EnergyState)

    line = "Total Energy       :      -1398.72283494769499 Eh          -38061.18333 eV"
    parser.parse(line)

    assert isinstance(parser.state, NormalState)

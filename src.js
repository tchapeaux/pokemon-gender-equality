const MEN_COLOR = "seagreen";
const WOMEN_COLOR = "salmon";

function round2Digits(number) {
  return Math.round(number * 100) / 100;
}

async function doGraph() {
  const res = await fetch("./data/combined_out.json");
  const data = await res.json();

  const labels = data.map((elem) => elem.zone);

  const throughTimeGraph = document.getElementById("throughTimeGraph");
  const occurenceGraph = document.getElementById("occurenceGraph");
  const avgGraph = document.getElementById("avgGraph");

  if (throughTimeGraph) {
    // Divide by 1000 so the graph is nicer
    const maleMoneyAcc = data.map(({ accMoneyMen }) => accMoneyMen / 1000);
    const femaleMoneyAcc = data.map(
      ({ accMoneyWomen }) => accMoneyWomen / 1000
    );

    new Chart(throughTimeGraph.getContext("2d"), {
      // The type of chart we want to create
      type: "line",

      // The data for our dataset
      data: {
        labels,
        datasets: [
          {
            label: "from women",
            backgroundColor: WOMEN_COLOR,
            borderWidth: 0,
            pointRadius: 0,
            data: femaleMoneyAcc,
          },
          {
            label: "from men",
            backgroundColor: MEN_COLOR,
            borderWidth: 0,
            pointRadius: 0,
            data: maleMoneyAcc,
          },
        ],
      },

      options: {
        title: {
          display: true,
          text: "Prize money by gender",
        },
        scales: {
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "Game progress",
              },
            },
          ],
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "* 1k Pokémon Dollars",
              },
              stacked: true,
            },
          ],
        },
      },
    });
  }

  if (occurenceGraph) {
    const maleEncountersAcc = data.map(
      ({ accEncounterMen }) => accEncounterMen
    );
    const femaleEncountersAcc = data.map(
      ({ accEncounterWomen }) => accEncounterWomen
    );

    new Chart(occurenceGraph.getContext("2d"), {
      // The type of chart we want to create
      type: "line",

      // The data for our dataset
      data: {
        labels,
        datasets: [
          {
            label: "women",
            backgroundColor: WOMEN_COLOR,
            borderWidth: 0,
            pointRadius: 0,
            data: femaleEncountersAcc,
          },
          {
            label: "men",
            backgroundColor: MEN_COLOR,
            borderWidth: 0,
            pointRadius: 0,
            data: maleEncountersAcc,
          },
        ],
      },

      options: {
        title: {
          display: true,
          text: "Trainers fought by gender",
        },
        scales: {
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "Game progress",
              },
            },
          ],
          yAxes: [
            {
              stacked: true,
            },
          ],
        },
      },
    });
  }

  if (avgGraph) {
    const maleAvgMoneyAcc = data.map(({ accMoneyMen, accEncounterMen }) =>
      accEncounterMen === 0 ? 0 : accMoneyMen / accEncounterMen
    );
    const femaleAvgMoneyAcc = data.map(({ accMoneyWomen, accEncounterWomen }) =>
      accEncounterWomen === 0 ? 0 : accMoneyWomen / accEncounterWomen
    );

    new Chart(avgGraph.getContext("2d"), {
      // The type of chart we want to create
      type: "line",

      // The data for our dataset
      data: {
        labels,
        datasets: [
          {
            label: "women",
            borderColor: WOMEN_COLOR,
            borderWidth: 3,
            pointRadius: 0,
            data: femaleAvgMoneyAcc.map(round2Digits),
          },
          {
            label: "men",
            borderColor: MEN_COLOR,
            borderWidth: 3,
            pointRadius: 0,
            data: maleAvgMoneyAcc.map(round2Digits),
          },
        ],
      },

      options: {
        title: {
          display: true,
          text: "Average prize money per gender",
        },
        scales: {
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "Game progress",
              },
            },
          ],
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "Pokémon Dollars",
              },
            },
          ],
        },
      },
    });
  }
}

window.onload = doGraph;

const express = require("express");
const joyas = require("./data/joyas.js");
const app = express();
app.listen(3000, () => console.log("Your app listening on port 3000"));

const joya = (id) => {
  return joyas.results.find((joya) => joya.id == id);
};

app.get("/", (_, res) => {
  res.send("Oh wow! this is working =)");
});

app.get("/", (_, res) => {
  res.send(joyas);
});
// 1. Crear una ruta para la devolución de todas las joyas aplicando HATEOAS.
const HATEOASV1 = () =>
  joyas.results.map((joya) => {
    return {
      name: joya.name,
      href: `http://localhost:3000/api/v1/joya/${joya.id}`,
    };
  });
app.get("/api/v1/joyas", (_, res) => {
  res.send({
    joyas: HATEOASV1(),
  });
});

// 2. Hacer una segunda versión de la API que ofrezca los mismos datos pero con los
// nombres de las propiedades diferentes.
const HATEOASV2 = () =>
  joyas.results.map((joya) => {
    return {
      nombre: joya.name,
      url: `http://localhost:3000/api/v2/joya/${joya.id}`,
    };
  });

// 7. Permitir hacer ordenamiento de las joyas según su valor de forma ascendente o
// descendente usando Query Strings.
const orderValues = (order) => {
  if (order === "asc") {
    return joyas.results.sort((a, b) => (a.value > b.value ? 1 : -1));
  } else if (order === "desc") {
    return joyas.results.sort((a, b) => (a.value < b.values ? 1 : -1));
  }
  return joyas.results;
};
app.get("/api/v2/joyas", (req, res) => {
  const { values } = req.query;
  if (values == "asc") return res.send(orderValues("asc"));
  if (values == "desc") return res.send(orderValues("desc"));
  if (req.query.page) {
    const { page } = req.query;
    return res.send({ joyas: HATEOASV2().slice(page * 3 - 3, page * 3) });
  }
  res.send({
    joyas: HATEOASV2(),
  });
});

// 3. La API REST debe poder ofrecer una ruta con la que se puedan filtrar las joyas por
// categoría.
const filtroByCategory = (category) => {
  return joyas.results.filter((joya) => joya.category === category);
};
app.get("/api/v2/category/:categoria", (req, res) => {
  const { categoria } = req.params;
  const joyasFiltradas = filtroByCategory(categoria);
  res.send({
    cant: joyasFiltradas.length,
    joyas: joyasFiltradas,
  });
});
// 6. Permitir hacer paginación de las joyas usando Query Strings.
const fieldsSelect = (joya, fields) => {
  return fields.reduce((acc, currentValues) => {
    acc[currentValues] = joya[currentValues];
    return acc;
  }, {});
};

// 4. Crear una ruta que permita el filtrado por campos de una joya a consultar.
app.get("/api/v2/joya/:id", (req, res) => {
  const { id } = req.params;
  const { fields } = req.query;
  const joyaid = joya(id);

  if (fields)
    return res.send({
      joya: fieldsSelect(joyaid, fields.split(",")),
    });

  // 5. Crear una ruta que devuelva como payload un JSON con un mensaje de error cuando
  // el usuario consulte el id de una joya que no exista.
  joyaid
    ? res.send({ joya: joyaid })
    : res.status(404).send({
        error: "404 no encontrado",
        message: "No Existe una joya con ese ID",
      });
});

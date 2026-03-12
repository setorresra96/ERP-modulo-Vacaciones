const express = require('express');
const router = express.Router();
const verificarToken = require('../../middlewares/verificarToken');
const vacacionesController = require('./vacaciones.controller');

router.use(verificarToken);

router.get('/', vacacionesController.listar);
router.get('/puede-aprobar', vacacionesController.puedeAprobar);
router.get('/saldo', vacacionesController.saldo);
router.post('/solicitar', vacacionesController.solicitar);
router.put('/:id/responder', vacacionesController.responder);

module.exports = router;

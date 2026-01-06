import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import adiantamentoRoutes from './router/adiantamentos';
import contratoRoutes from './router/contratos';
import gerenciaRoutes from './router/gerencias';
import viagemRoutes from './router/viagens';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/adiantamentos', adiantamentoRoutes);
app.use('/contratos', contratoRoutes);
app.use('/gerencias', gerenciaRoutes);
app.use('/viagens', viagemRoutes);

export default app; 
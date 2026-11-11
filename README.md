# Conversor de Moedas — React Native + MVVM

Aplicativo mobile que converte valores entre moedas usando as taxas de referência da
[API Frankfurter](https://frankfurter.dev). Feito com React Native (Expo) e JavaScript,
seguindo a arquitetura MVVM.

> As taxas são de **referência** e a data retornada pela API é exibida no resultado.
> Não representam cotação comercial em tempo real.

## Estrutura (MVVM)

```
ConversorMoedas/
├── App.js                                  # ponto de entrada
└── assets/src/
    ├── models/currencyModel.js             # MODEL: fetch na API, tratamento de erros
    ├── viewmodels/useCurrencyConverter.js  # VIEWMODEL: estados, validação, cálculo
    └── views/ConverterScreen.js            # VIEW: tela, campos, botões, resultado
```

| Camada    | Responsabilidade                                                                  |
|-----------|-----------------------------------------------------------------------------------|
| Model     | Listar moedas, buscar taxa, diferenciar erro de rede / HTTP / resposta inválida  |
| ViewModel | Estados, validação, chamar o Model, calcular `valor × taxa`, loading e erros      |
| View      | Exibir estados e repassar ações do usuário; sem fetch nem regras de negócio       |

## Como instalar e executar

Pré-requisitos: [Node.js](https://nodejs.org) (versão compatível com o Expo) e o app
**Expo Go** no celular (ou um emulador Android/iOS).

```bash
git clone 
cd ConversorMoedas
npm install
npx expo install @react-native-picker/picker expo-status-bar
npx expo start
```


O projeto também pode ser executado no [Expo Snack]

## Funcionalidades

- Lista de moedas carregada da API (`/v2/currencies`)
- Taxa obtida da API a cada conversão (`/v2/rate/{origem}/{destino}`)
- Validação: valor vazio, não numérico, zero/negativo e moedas iguais são bloqueados
- Aceita decimais com vírgula ou ponto (`10,50`); entradas ambíguas como `1.000,50` são rejeitadas
- Indicador de carregamento, botão bloqueado durante a consulta e "tentar novamente" em falhas
- Respostas antigas são descartadas (só a consulta mais recente atualiza a tela)
- Resultado com valor, moedas, taxa e data de referência
- Extra: botão para inverter moedas

## Checklist de testes

- [x] Lista de moedas carrega ao abrir
- [x] Conversão válida (ex.: 100 USD → BRL)
- [x] Campo vazio mostra orientação
- [x] Zero ou negativo é bloqueado
- [x] Decimal com vírgula (`10,50`) funciona
- [x] Moedas iguais são bloqueadas
- [x] Sem internet: mensagem de erro + tentar novamente
- [x] Loading aparece e some ao terminar
- [x] Nova conversão atualiza o resultado
- [x] Taxa e data aparecem no resultado

## Capturas de tela

![Tela inicial]
![Resultado
![Erro]
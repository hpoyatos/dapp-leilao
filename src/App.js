import React, { Component } from 'react';
import './App.css';
import web3 from './web3';
import LeilaoContractABIJSON from './CasaLeilao.json';
import FiapTokenABIJSON from './FiapToken.json';

import Participar from './components/Participar';
import LeilaoGestao from './components/LeilaoGestao';
import LeilaoAtivo from './components/LeilaoAtivo';

import {
  Grid,
  Container,
  Header,
  Icon,
  Table,
  Message
} from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      Leilao: null,
      carteira: null,
      network: null,
      gasPrice: 10000000000,
      liberado: true,
      FiapToken: null,
      saldo: null,
      nome: '',
      networkContract: 'ropsten',
      leilaoAtivo: null,
      leilaoId: null,
      leiloesEncerrados: []
    };

    this.state.web3 = web3;
    var FiapTokenContractAddress = "0x1d900fcb6375a9cecEBa0eEE09332d042548D997";
    var LeilaoContractAddress = "0x9c0b5b69357a18E56B41ca5D674f8FF6D61383E9";
    // creation of contract object
    var LeilaoContractABI = web3.eth.contract(LeilaoContractABIJSON.abi);
    // initiate contract for an address
    var LeilaoContract = LeilaoContractABI.at(LeilaoContractAddress);
    // call constant function
    this.state.Leilao = LeilaoContract;

    var FiapTokenABI = web3.eth.contract(FiapTokenABIJSON.abi);
    var FiapToken = FiapTokenABI.at(FiapTokenContractAddress);
    this.state.FiapToken = FiapToken;

    this.atualizarSaldo = this.atualizarSaldo.bind(this);
    this.ativarLeilao = this.ativarLeilao.bind(this);
  }

  async componentDidMount() {
    var that = this;
    this.checkNetwork(that);
    this.checkGasPrice(that);

    this.state.web3.eth.getAccounts(function(error, result){
      if (!error && result.length > 0) {
        that.setState({liberado: true, carteira: result[0]});
        that.atualizarSaldo();

        //Participante
        that.state.Leilao.getParticipante.call(that.state.carteira,
          { from: that.state.carteira, gasPrice: that.state.gasPrice },
          function(error, result) {
            if (result !== "") {
              that.setState({nome: result});
            }
          });
          that.watchParticipante(that);
          that.watchFimDeLeilao(that);
          that.checkLeilaoAtivo(that);
      } else {
        that.setState({liberado: false});
        console.log(error);
      }

    });
  }

  watchParticipante(that){
    var ParticipanteEvent = that.state.Leilao.Participante({some: 'args'}, {fromBlock: this.state.Leilao.defaultBlock, toBlock: 'latest'});
    ParticipanteEvent.watch(function(error, result){
      if (!error){
        //console.log(result);
        if (that.state.carteira === result.args._carteira){
            that.setState({nome: result.args._nome, saldo: result.args._saldo.c});
        }
      };
    });
  }

  watchFimDeLeilao(that) {
    var FimDeLeilaoEvent = that.state.Leilao.FimDeLeilao({some: 'args'}, {fromBlock: 0, toBlock: 'latest'});
    FimDeLeilaoEvent.watch(function(error, result){
        if (!error){
          //console.log(result);
          var _leiloesEncerrados = that.state.leiloesEncerrados;
          if(_leiloesEncerrados.indexOf(result.args._id) === -1){
            _leiloesEncerrados[result.args._id] = {nome: result.args._nome, ganhadorNome: result.args._nomeGanhador, ganhadorCarteira: result.args._ganhador, ganhadorLance: result.args._lance.c};
          }
          that.setState({leiloesEncerrados: _leiloesEncerrados});
          if (that.state.leilaoId*1 === result.args._id*1) {
            that.setState({leilaoAtivo: false});
          }
          //console.log(that.state.leiloesEncerrados);
        }
    });
  }

  checkGasPrice(that){
    that.state.web3.eth.getGasPrice(function(error, result) {
      console.log("Gas Price: "+result);
      if(that.state.gasPrice*1 < result*1) {
        console.log("Gas Price atualizado: "+result);
        that.setState({gasPrice: result});
      }
    });
  }
  checkLeilaoAtivo(that){
    this.state.Leilao.getLeilaoAtivo(
    { from: this.state.carteira, gasPrice: this.state.gasPrice },
    function(error, result) {
      if (result !== undefined && result.c > 0){
        that.setState({leilaoId: result.c, leilaoAtivo: true});
      } else {
        that.setState({leilaoAtivo: false});
      }
    });
  }

  ativarLeilao(){
    console.log("Ativar Leilão");
    this.setState({leilaoAtivo: true});
  }

  checkNetwork(that) {
    // Verificando a rede
    that.state.web3.version.getNetwork(function(error, result){
      switch(result) {
         case "1":
           that.setState({network: "mainnet"});
         break;
         case "3":
           that.setState({network: "ropsten"});
         break;
         case "4":
           that.setState({network: "rinkeby"});
         break;
         case "5777":
           that.setState({network: "ganache (local)"});
         break;
         default:
           that.setState({network: result});
      }
    });
  }

  atualizarSaldo(){
    console.log('atualizarSaldo');

    var that = this;
    this.state.FiapToken.balanceOf(this.state.carteira, function(error, result){
      if (!error && result !== undefined){
        that.setState({saldo: result.c});
      }
    });
  }
  render() {
    if (this.state.liberado) {
      if(this.state.network !== null &&
         this.state.FiapToken !== null &&
         this.state.carteira !== null &&
         this.state.Leilao !== null &&
         this.state.leilaoAtivo !== null) {

        if (this.state.network === this.state.networkContract)
        {
          return (
            <div className="App">
              <Grid columns='equal'>
                {this.state.nome !== '' ?
                (<Grid.Row>
                  <Grid.Column><LeilaoAtivo FiapToken={this.state.FiapToken} leilaoAtivo={this.state.leilaoAtivo} Leilao={this.state.Leilao} carteira={this.state.carteira} gasPrice={this.state.gasPrice} atualizarSaldo={this.atualizarSaldo} ativarLeilao={this.ativarLeilao} /></Grid.Column>
                </Grid.Row>) :
                (<Grid.Row>
                  <Grid.Column><Participar Leilao={this.state.Leilao} carteira={this.state.carteira} gasPrice={this.state.gasPrice} saldo={this.state.saldo} /></Grid.Column>
                </Grid.Row>)}
                <Grid.Row>
                  <Grid.Column>
                    <Container><Header as='h3' block><Icon name='file alternate' />
                      <Header.Content>Informações</Header.Content>
                    </Header>
                    {this.state.nome !== '' ?
                    (<span><h4 className="ui horizontal divider header">
                      <i className="user icon"></i>
                      Participante
                    </h4><div> Nome: {this.state.nome}</div>
                    <div> Saldo: {this.state.saldo} FIAP</div></span>):(<div></div>)}
                    <h4 className="ui horizontal divider header">
                      <i className="money icon"></i>
                      Carteira
                    </h4>
                    <div size='small'>{this.state.carteira}</div>
                    <h4 className="ui horizontal divider header">
                      <i className="money icon"></i>
                      Número do Contrato
                    </h4>
                    <div size='small'>{this.state.Leilao.address}</div>
                    <br />
                    {this.state.network !== null ? (
                    <div><h4 className="ui horizontal divider header">
                      <i className="world icon"></i>
                      Rede
                    </h4>
                    <div>{this.state.network}</div></div>) : (<div></div>)}
                    </Container>
                  </Grid.Column>
                </Grid.Row>
                {this.state.leiloesEncerrados.length > 0 &&
                (<Grid.Row>
                  <Grid.Column>
                    <Container>
                      <Header as='h3' block><Icon name='file alternate' />
                        <Header.Content>Leilões Encerrados</Header.Content>
                      </Header>
                      <Table celled>
                        <Table.Header>
                          <Table.Row>
                            <Table.HeaderCell>Leilão</Table.HeaderCell>
                            <Table.HeaderCell>Ganhador</Table.HeaderCell>
                            <Table.HeaderCell>Lance</Table.HeaderCell>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                        {this.state.leiloesEncerrados.map(function(item, key) {
                              return (
                              <Table.Row key = {key}>
                                  <Table.Cell>{item.nome}</Table.Cell>
                                  <Table.Cell>{item.ganhadorNome}</Table.Cell>
                                  <Table.Cell>{item.ganhadorLance}</Table.Cell>
                              </Table.Row>)
                        })}
                        </Table.Body>
                      </Table>
                    </Container>
                  </Grid.Column>
                </Grid.Row>)}
                <Grid.Row>
                  <Grid.Column><LeilaoGestao FiapToken={this.state.FiapToken} Leilao={this.state.Leilao} carteira={this.state.carteira} leilaoAtivo={this.state.leilaoAtivo} gasPrice={this.state.gasPrice} /></Grid.Column>
                </Grid.Row>
              </Grid>
            </div>
          );
        } else {
          var messageError = "Você está na rede errada. Aponte sua carteira para a rede \""+this.state.networkContract+"\" (em configurações.)";
          return (<div className="App"><Container><Message error header={messageError} /></Container></div>);
        }
      } else {
        return (<div className="App"></div>);
      }
    } else {
      messageError = "Instale e/ou abra sua carteira.";
      return (<div className="App"><Container><Message error header={messageError} /></Container></div>);
    }
  }
}

export default App;

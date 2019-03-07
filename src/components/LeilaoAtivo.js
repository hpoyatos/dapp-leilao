import React, { Component } from 'react';
import {
  Container,
  Header,
  Grid,
  Message,
  Icon,
  Image,
  Dimmer,
  Loader
} from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';

class LeilaoAtivo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gasPrice: this.props.gasPrice,
      leilaoAtivo: this.props.leilaoAtivo,
      loading: false,
      leilaoId: 0,
      nome: '',
      foto: '',
      maiorLance: 0,
      lance: 0,
      saldo: 0,
      semSaldo: false,
      Leilao: this.props.Leilao,
      FiapToken: this.props.FiapToken,
      carteira: this.props.carteira,
      seuMelhorLance: 0,
      messageSuccess: '',
      messageError: ''
    };

    this.parentAtualizarSaldo = props.atualizarSaldo;
    this.ativarLeilao = props.ativarLeilao;
  }

  async componentDidMount() {
    this.atualizarSaldo();
    this.watchInicioDeLeilao(this);
    this.watchLance(this);

    var that = this;
    this.state.Leilao.getLeilaoAtivo(
    { from: this.state.carteira, gasPrice: this.state.gasPrice },
      function(error, result) {
        if (result !== undefined){
          that.setState({leilaoId: result.c});
          if (that.state.leilaoId > 0){
            that.setState({leilaoAtivo: true});

            that.state.Leilao.getLeilao(
            that.state.leilaoId,
            { from: that.state.carteira, gasPrice: that.state.gasPrice },
            function(error, result) {
              that.setState({nome: result[0], foto: result[1], maiorLance: result[2].c});
              that.sugerirLance();
            });

            that.state.Leilao.getSeuUltimoLance(
            that.state.leilaoId,
            { from: that.state.carteira, gasPrice: that.state.gasPrice },
            function(error, result){
              if (!error)
                that.setState({seuMelhorLance: result.c});
            });
          }
        }
      });
  }

  atualizarSaldo(){
    var that = this;
    this.state.FiapToken.balanceOf(this.state.carteira, function(error, result){
      if (!error && result !== undefined){
        that.setState({saldo: result.c});
      }
    });
  }

  componentWillReceiveProps(props) {
    if (this.state.leilaoAtivo !== props.leilaoAtivo){
      this.setState({leilaoAtivo: props.leilaoAtivo});
      console.log("Mandou LeilaoAtivo");
    }
  }

  watchInicioDeLeilao(that){
    var InicioDeLeilaoEvent = that.state.Leilao.InicioDeLeilao({some: 'args'}, {fromBlock: this.state.Leilao.defaultBlock, toBlock: 'latest'});
    InicioDeLeilaoEvent.watch(function(error, result){
      if (!error){
        console.log("InicioDoLeilaoEvent");
        that.setState({
          leilaoAtivo: true,
          leilaoId: result.args._id.c,
          nome: result.args._nome,
          foto: result.args._foto,
          maiorLance: 0});

          that.ativarLeilao();
          that.sugerirLance();
      };
    });
  }

  watchLance(that){
    console.log("watch lance");

    var LanceEvent = that.state.Leilao.Lance({some: 'args'}, {fromBlock: that.state.Leilao.defaultBlock, toBlock: 'latest'});
    LanceEvent.watch(function(error, result){
        if (!error){
          console.log(result);
          if (that.state.leilaoId*1 === result.args._id.c*1){
            if (result.args._donoDoLance === that.state.carteira){
              if (result.args._lance.c > 0){
                that.setState({loading: false, messageSuccess: "Lance realizado.", seuMelhorLance: result.args._lance.c});
                that.parentAtualizarSaldo();
                that.atualizarSaldo();
              } else {
                that.setState({loading: false, messageError: "Lance não realizado. Por favor, tente novamente"});
              }

            }
            that.setState({maiorLance: result.args._lance.c});
            that.sugerirLance();
          }
        }
    });
  }

  sugerirLance()
  {
    //console.log("sugestão");
    if (this.state.lance <= this.state.maiorLance) {
      this.setState({lance: this.state.maiorLance*1 + 10});
    }

    if (this.state.lance > (this.state.saldo*1 + this.state.seuMelhorLance*1)){
      this.setState({semSaldo: true});
    } else {
      this.setState({semSaldo: false});
    }
  }

  onLanceChanged = e => {
    this.setState({lance: e.target.value, messageSuccess: '', messageError: ''});
  }

  onLanceBlur = e => {
    if (this.state.lance > (this.state.saldo*1 + this.state.seuMelhorLance*1)){
      this.setState({messageError: "Você não tem saldo para este lance."});
    } else {
      this.setState({messageError: ""});
    }
  }

  onSubmitLance = async event => {
    event.preventDefault();
    //var that = this;
    console.log("Lance :"+this.state.lance);
    console.log("Maior Lance:"+this.state.maiorLance);
    if (this.state.leilaoAtivo && this.state.lance*1 > this.state.maiorLance*1) {
      this.setState({loading: true, messageError: "", messageSuccess: ""});

      this.state.Leilao.darLance(this.state.leilaoId,
        this.state.lance,
        { from: this.state.carteira, gasPrice: this.state.gasPrice },
        function(error, result) {
          if(!error){

          }
      });
    }
    else {
      this.setState({messageError: "Seu lance precisa ser maior que o lance atual"});
    }
  }

  render() {
      return (<Container>
        <Header as='h3' block>
          <Icon name='balance scale' />
          <Header.Content>Leilão</Header.Content>
        </Header>

          {this.state.leilaoAtivo ?
              (<Grid columns='equal' stackable padded>
                <Grid.Column>
                  <Container textAlign='center'>
                    <Header>{this.state.nome}</Header>
                    <div><Image centered src={this.state.foto} size='small' /></div>
                    <Message header={"Maior Lance: "+this.state.maiorLance+" FIAP"}></Message>

                    {!this.state.loading ?
                    (<div className="ui action input">
                      <input type="text" onBlur={this.onLanceBlur} onChange={this.onLanceChanged} value={this.state.lance} />
                      {!this.state.semSaldo ?
                        (<button color="blue" className="ui button" onClick = {this.onSubmitLance}>Dar Lance</button>)
                      :
                        (<button className="ui button" disabled>Sem Saldo</button>)
                      }
                    </div>) : (<div><Dimmer active inverted>
                                      <Loader inverted>Realizando Lance ...</Loader>
                                    </Dimmer></div>)}

                {this.state.messageSuccess !== '' &&
                (<Message success header={this.state.messageSuccess} />)
                }
                {this.state.messageError !== '' &&
                (<Message error header={this.state.messageError} />)
                }
                <Message header={"Seu melhor lance: "+this.state.seuMelhorLance+" FIAP"+(this.state.maiorLance*1 !== 0 && this.state.maiorLance*1 === this.state.seuMelhorLance*1 ? " (Atual Vencedor)" : "")}></Message>
                  </Container>
              </Grid.Column>
              </Grid>
            ) : ( <Message error header="Leilão não está ativo" /> )}
       </Container>);
  }
}
export default LeilaoAtivo;

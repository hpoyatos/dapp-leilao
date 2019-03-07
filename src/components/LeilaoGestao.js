import React, { Component } from 'react';
import {
  Container,
  Header,
  Grid,
  Button,
  Icon,
  Form
} from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';

class LeilaoGestao extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gasPrice: this.props.gasPrice,
      leilaoAtivo: false,
      loading: false,
      nome: '',
      foto: '',
      liberado: true,
      FiapToken: this.props.FiapToken,
      Leilao: this.props.Leilao,
      carteira: this.props.carteira,
      admin: false,
      leilaoId: 0
    };

  }

  async componentDidMount() {
    var that = this;

    this.state.Leilao.isWhitelistAdmin(this.state.carteira,
    { from: this.state.carteira, gasPrice: this.state.gasPrice },
      function(error, result) {
        console.log(result);
        that.setState({admin: result});
        that.checkLeilaoAtivo();
    });
  }

  componentWillReceiveProps(props) {
    if (this.state.leilaoAtivo !== props.leilaoAtivo){
      this.setState({leilaoAtivo: props.leilaoAtivo});
      console.log("Mandou LeilaoAtivo");
    }


  }

  checkLeilaoAtivo() {
    var that = this;
    //console.log(this.state.admin);
    if (this.state.admin){
      this.state.Leilao.getLeilaoAtivo(
      { from: this.state.carteira, gasPrice: this.state.gasPrice },
          function(error, result) {
          //console.log(result);
          if (result > 0){
            that.setState({leilaoId: result.c});
            //console.log(that.state.leilaoId);
            that.setState({leilaoAtivo: true});
          }
      });
    }
  }
  onNomeChanged = e => {
    this.setState({nome: e.target.value});
  }

  onFotoChanged = e => {
    this.setState({foto: e.target.value});
  }

  onSubmitNome = async event => {
    event.preventDefault();

    this.setState({loading: true});
    var that = this;

    const min = 1000000000;
    const max = 9999999999;
    var rand = min + Math.random() * (max - min);
    var randNum = Math.trunc(rand);
    console.log(randNum);
    this.setState({leilaoId: randNum});

    this.state.Leilao.addLeilao(randNum, this.state.nome, this.state.foto,
      { from: this.state.carteira, gasPrice: this.state.gasPrice },
      function(error, result) {
        console.log(error);
        console.log(result);

        if (result !== "" && error === null) {
          that.setState({loading: false, leilaoAtivo: true});
          that.checkLeilaoAtivo();
        }
    });
  }

  onEncerrarLeilao = async event => {
    event.preventDefault();

    this.setState({loading: true});
    console.log("Encerrar Leilão: "+this.state.leilaoId+" ("+this.state.carteira+","+this.state.gasPrice+")");
    this.state.Leilao.encerrarLeilao(this.state.leilaoId,
      { from: this.state.carteira, gasPrice: this.state.gasPrice },
      function(error, result) {
        console.log(error);
      });
  }

  button() {
    if (!this.state.leilaoAtivo){
      if (this.state.loading) {
        return (<Button primary loading onClick = {this.onSubmitNome}> Abrir Leilão</Button>);
      }
      else {
        return (<Button primary onClick = {this.onSubmitNome}> Abrir Leilão</Button>);
      }
    } else {
      if (this.state.loading) {
        return (<Button primary loading onClick = {this.onEncerrarLeilao}> Encerrar Leilão</Button>);
      } else {
        return (<Button primary onClick = {this.onEncerrarLeilao}> Encerrar Leilão</Button>);
      }
    }

  }

  render() {
    if (this.state.admin){
      return (<Container>
        <Header as='h3' block>
          <Icon name='cubes' />
          <Header.Content>Leilão (Gestão)</Header.Content>
        </Header>

          {!this.state.leilaoAtivo ?
            (<Grid columns='equal' stackable padded>
              <Grid.Column>
              <Container>
                <Form>
                  <Form.Group>
                    <Form.Input
                      label="Nome do item"
                      placeholder='Nome do item'
                      value={this.state.lance}
                      onChange={this.onNomeChanged} />
                  </Form.Group>
                  <Form.Group>
                    <Form.Input
                      label="URL da Foto"
                      placeholder='URL da Foto'
                      value={this.state.lance}
                      onChange={this.onFotoChanged} />
                  </Form.Group>
                </Form><br />
                {this.button()}
              </Container>
            </Grid.Column>
            </Grid>
          ) : ( <Grid columns='equal' stackable padded><Grid.Column>{this.state.nome}</Grid.Column><Grid.Column>{this.button()}</Grid.Column></Grid>)}
       </Container>);
    } else {
      return ("");
    }

  }
}
export default LeilaoGestao;

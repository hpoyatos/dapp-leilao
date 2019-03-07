import React, { Component } from 'react';
import {
  Container,
  Header,
  Button,
  Icon,
  Form,
  Message,
  Dimmer,
  Loader
} from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';

class Participar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gasPrice: this.props.gasPrice,
      carteira: this.props.carteira,
      Leilao: this.props.Leilao,
      loading: false,
      nome: '',
      message: '',
      liberado: true
    };
  }

  componentWillReceiveProps(props) {
    if (props.carteira !== null && props.Leilao !== null) {
      this.setState({carteira: props.carteira});
      this.setState({Leilao: props.Leilao});
    }
  }

  onNomeChanged = e => {
    if (e.target.value !== ""){
      this.setState({message: ""});
    }
    this.setState({nome: e.target.value});
  }

  /* Submete Participação */
  onSubmitNome = async event => {
    event.preventDefault();

    if (this.state.nome !== "") {
      this.setState({loading: true});
      this.state.Leilao.addParticipante(this.state.nome,
        { from: this.state.carteira, gasPrice: this.state.gasPrice }, function(error,result) {});
    } else {
      this.setState({message: "Digite seu nome completo."});
    }
  }

  button() {
    if (this.state.liberado)
    {
      return (<Button primary onClick = {this.onSubmitNome}> Participar</Button>);
    }
    else {
      return (<Button disabled> Sem carteira</Button>);
    }

  }

  render() {
    return (<Container textAlign='left'>
      <Header as='h3' block>
        <Icon name='user outline' />
        <Header.Content>Participante</Header.Content>
      </Header>

        {!this.state.loading ?
          (<Form>
                <Form.Input label="Nome completo"
                  placeholder='Seu nome e sobrenome'
                  onChange={this.onNomeChanged} />
              {this.button()}
            </Form>
        ) : ( <div><Dimmer active inverted>
                          <Loader inverted>Cadastrando participante ...</Loader>
                        </Dimmer></div>)}

        {this.state.message !== "" ?
        (<Message error header={this.state.message} />) : (<div></div>) }
     </Container>);
  }
}
export default Participar;

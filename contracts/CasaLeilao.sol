pragma solidity 0.5.0;

import "./FiapToken.sol";
import "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";


contract CasaLeilao is WhitelistAdminRole {
    address private fiapTokenAddress;

    struct Leilao {
        uint24 id;
        string nome;
        string foto;
        uint24 maiorLance;
        address donoMaiorLance;
        bool ativo;
        bool isValue;
        uint24 numLances;
        mapping(address => uint24) lances;
    }

    uint24 private leilaoAtivo = 0;
    address[] private partWallets;
    mapping(uint24 => Leilao) private leiloes;
    mapping(address => string) private participantes;

    event Lance(uint24 _id, address _donoDoLance, uint24 _lance);
    event FimDeLeilao(uint24 _id, string _nome, address _ganhador, string _nomeGanhador, uint24 _lance);
    event InicioDeLeilao(uint24 _id, string _nome, string _foto);
    event Participante(address _carteira, string _nome, uint _saldo);

    function addLeilao(uint24 _leilaoId, string memory _nome,
        string memory _foto) public onlyWhitelistAdmin returns (bool _situacaoLeilao) {
        if (leiloes[_leilaoId].isValue == false) {
            leiloes[_leilaoId] = Leilao({
                id: _leilaoId,
                nome: _nome,
                foto: _foto,
                maiorLance: 0,
                donoMaiorLance: address(0),
                ativo: true,
                isValue: true,
                numLances: 0
            });
            leilaoAtivo = _leilaoId;
            emit InicioDeLeilao(_leilaoId, _nome, _foto);
            return true;
        } else {
            return false;
        }
    }

    function encerrarLeilao(uint24 _leilaoId) public onlyWhitelistAdmin returns (bool _situacaoLeilao) {
        for (uint i=0; i < partWallets.length; i++) {
            if (partWallets[i] != leiloes[_leilaoId].donoMaiorLance) {
                FiapToken(fiapTokenAddress).mint(partWallets[i], leiloes[_leilaoId].lances[partWallets[i]]);
            }
        }
        delete partWallets;
        leiloes[_leilaoId].ativo = false;
        leilaoAtivo = 0;

        emit FimDeLeilao(
            _leilaoId,
            leiloes[_leilaoId].nome,
            leiloes[_leilaoId].donoMaiorLance,
            participantes[leiloes[_leilaoId].donoMaiorLance],
            leiloes[_leilaoId].maiorLance
        );
        return true;
    }

    function addParticipante(string memory _nome) public returns (bool _situacao) {
        participantes[msg.sender] = _nome;
        uint24 saldo = 1000;
        FiapToken(fiapTokenAddress).mint(msg.sender, saldo);

        emit Participante(msg.sender, _nome, FiapToken(fiapTokenAddress).balanceOf(msg.sender));
        return true;
    }

    function darLance(uint24 _leilaoId, uint24 _valorLance) public returns (bool _situacaoLance) {
        if (
        leiloes[_leilaoId].ativo == true &&
        _valorLance > leiloes[_leilaoId].maiorLance &&
        (FiapToken(fiapTokenAddress).balanceOf(msg.sender) + leiloes[_leilaoId].lances[msg.sender]) >= _valorLance) {

            uint24 destruir = 0;
            if (leiloes[_leilaoId].lances[msg.sender] > 0) {
                destruir = _valorLance - leiloes[_leilaoId].lances[msg.sender];
            } else {
                partWallets.push(msg.sender);
                destruir = _valorLance;
            }
            leiloes[_leilaoId].lances[msg.sender] = _valorLance;
            leiloes[_leilaoId].donoMaiorLance = msg.sender;
            leiloes[_leilaoId].maiorLance = _valorLance;
            FiapToken(fiapTokenAddress).burnFrom(msg.sender, msg.sender, destruir);

            emit Lance(_leilaoId, msg.sender, _valorLance);
            return true;
        } else {
            emit Lance(_leilaoId, msg.sender, 0);
            return false;
        }
    }

    function getParticipante(address _address) public view returns (string memory _nome) {
        return (participantes[_address]);
    }

    function getSeuUltimoLance(uint24 _leilaoId) public view
    returns (uint24 _ultimoLance) {
        return leiloes[_leilaoId].lances[msg.sender];
    }

    function getLeilao(uint24 _leilaoId) public view
    returns (string memory _nome, string memory _foto,
        uint24 _maiorLance, bool _ativo) {
        return (leiloes[_leilaoId].nome, leiloes[_leilaoId].foto,
        leiloes[_leilaoId].maiorLance, leiloes[_leilaoId].ativo);
    }

    function getLeilaoAtivo() public view returns (uint24) {
        return leilaoAtivo;
    }

    constructor(
    address _fiapTokenAddress) public {
    fiapTokenAddress = _fiapTokenAddress;
}
}

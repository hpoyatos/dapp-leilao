const FiapToken = artifacts.require("FiapToken");
const CasaLeilao = artifacts.require("CasaLeilao");

module.exports = function(deployer) {
  //deployer.deploy(FiapToken).then(function() {
    //return
      deployer.deploy(CasaLeilao, FiapToken.address).then(async () => {
      var fiapTokenInstance = await FiapToken.deployed();
      await fiapTokenInstance.addWhitelistAdmin(CasaLeilao.address);
      console.log("adicionou whitelist "+CasaLeilao.address);
      await fiapTokenInstance.addController(CasaLeilao.address);
      console.log("adicionou addcontroller "+CasaLeilao.address);
    });
  //});
};

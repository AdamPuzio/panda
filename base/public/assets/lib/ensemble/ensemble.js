/*import EnsembleClass from "./lib/core.js";
import "./lib/authentication.js";
const Ensemble = new EnsembleClass()
export default Ensemble;
*/

;(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['axios'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('axios'));
  } else {
    root.Ensemble = factory(root.axios);
  }

}(this, function (axios) {
  var Ensemble = {}
  
  Ensemble.test = function() { console.log('Ensemble.test()') }
  
  let localRoutes = {
    home: '/',
    login: '/login',
    logout: '/logout',
    profile: '/profile'
  }
  Ensemble.redirect = function(url) {
    let gourl = localRoutes[url] || url
    window.location.href = gourl
  }
  
  /**
   * Ensemble.API 
   */
  
  Ensemble.API = {}
  
  Ensemble.API.call = async function(action, params) {
    const res = await axios.post(action, params)
    console.log('API call')
    console.log(res)
    if(!res.data) {
      
    }
    return res.data
  }
  
  return Ensemble;
}));
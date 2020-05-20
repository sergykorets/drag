class SslVerifyController < ApplicationController
  def verify_1
    render plain:
               "9B57048214436C93E9AAAFF8E2A56346CC228F417C3EB6AAC01E5E7C6D214070
                comodoca.com
                6636894796e347d"
  end
  def verify_2
    render plain: "HNn4g3VE6rqYid3Vlh4bcQ8XArEFElKb-gzyNjZIdUg.gJFrAd6N1BdWC1Hj_dYNAB5qKM6NqFh4cqBMzSUklzM"
  end
end
class SslVerifyController < ApplicationController
  def verify_1
    render file: "public/A53663A8473F98B5AEB150819BAEA25C.txt"
  end
  def verify_2
    render plain: "HNn4g3VE6rqYid3Vlh4bcQ8XArEFElKb-gzyNjZIdUg.gJFrAd6N1BdWC1Hj_dYNAB5qKM6NqFh4cqBMzSUklzM"
  end
end